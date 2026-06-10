#!/bin/bash

# =============================================================================
# Advanced Error Handling Utilities for CI/CD Scripts
# =============================================================================

# Load logging utilities
source infra-cicd-tools/scripts/utils/logging.sh

# Error codes
declare -A ERROR_CODES=(
    ["VALIDATION_ERROR"]=10
    ["CONFIG_ERROR"]=11
    ["NETWORK_ERROR"]=12
    ["PERMISSION_ERROR"]=13
    ["RESOURCE_ERROR"]=14
    ["TIMEOUT_ERROR"]=15
    ["UNKNOWN_ERROR"]=99
)

# Trap signals
set -Eeuo pipefail

# Error handler function
error_handler() {
    local exit_code=$?
    local line_number=$1
    local command_name=$2
    local error_message="${3:-Unknown error}"
    
    log_error "Script failed!"
    log_error "Exit code: $exit_code"
    log_error "Line number: $line_number"
    log_error "Command: $command_name"
    log_error "Message: $error_message"
    
    # Additional debug info
    if [ "$LOG_LEVEL" = "DEBUG" ]; then
        log_error "Stack trace:"
        local frame=0
        while caller $frame; do
            ((frame++))
        done
    fi
    
    exit $exit_code
}

# Set trap for errors
set_error_trap() {
    trap 'error_handler ${LINENO} "${BASH_COMMAND}" "${BASH_SOURCE[0]}"' ERR
    trap 'cleanup_on_exit' EXIT
    log_debug "Error trap set"
}

# Cleanup function
cleanup_on_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_warning "Performing cleanup due to error exit"
        # Add cleanup operations here
    fi
}

# Validation functions
validate_not_empty() {
    local variable_name="$1"
    local variable_value="${!variable_name:-}"
    
    if [ -z "$variable_value" ]; then
        throw_error "VALIDATION_ERROR" "Variable $variable_name cannot be empty"
    fi
}

validate_file_exists() {
    local file_path="$1"
    local error_message="${2:-File not found: $file_path}"
    
    if [ ! -f "$file_path" ]; then
        throw_error "RESOURCE_ERROR" "$error_message"
    fi
}

validate_directory_exists() {
    local dir_path="$1"
    local error_message="${2:-Directory not found: $dir_path}"
    
    if [ ! -d "$dir_path" ]; then
        throw_error "RESOURCE_ERROR" "$error_message"
    fi
}

validate_command_exists() {
    local command_name="$1"
    
    if ! command -v "$command_name" &> /dev/null; then
        throw_error "RESOURCE_ERROR" "Command not found: $command_name"
    fi
}

# Throw error with specific code
throw_error() {
    local error_type="$1"
    local error_message="$2"
    local exit_code=${ERROR_CODES[$error_type]:-99}
    
    log_error "ERROR [$error_type]: $error_message"
    exit $exit_code
}

# Retry function with exponential backoff
retry() {
    local max_attempts="$1"
    local delay="$2"
    local command="$3"
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Attempt $attempt/$max_attempts: $command"
        
        if eval "$command"; then
            log_success "Command succeeded on attempt $attempt"
            return 0
        fi
        
        local wait_time=$((delay * (2 ** (attempt-1))))
        log_warning "Command failed. Retrying in ${wait_time}s..."
        sleep $wait_time
        ((attempt++))
    done
    
    throw_error "NETWORK_ERROR" "Command failed after $max_attempts attempts: $command"
}

# Timeout function
with_timeout() {
    local timeout_seconds="$1"
    local command="$2"
    
    log_debug "Executing with timeout: ${timeout_seconds}s"
    
    if timeout $timeout_seconds bash -c "$command"; then
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            throw_error "TIMEOUT_ERROR" "Command timed out after ${timeout_seconds} seconds: $command"
        else
            return $exit_code
        fi
    fi
}

# Safe command execution
safe_exec() {
    local command="$1"
    local error_message="${2:-Command failed: $command}"
    
    log_debug "Executing safely: $command"
    
    if ! eval "$command"; then
        throw_error "UNKNOWN_ERROR" "$error_message"
    fi
}

# Check exit code and throw if non-zero
check_exit_code() {
    local exit_code=$?
    local error_message="${1:-Command failed with exit code: $exit_code}"
    
    if [ $exit_code -ne 0 ]; then
        throw_error "UNKNOWN_ERROR" "$error_message"
    fi
}

# Validate required environment variables
validate_required_vars() {
    local missing_vars=()
    
    for var in "$@"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        throw_error "CONFIG_ERROR" "Missing required variables: ${missing_vars[*]}"
    fi
}

# Validate AWS configuration
validate_aws_config() {
    validate_required_vars AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_REGION
    validate_command_exists aws
    
    log_info "Validating AWS credentials..."
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        throw_error "PERMISSION_ERROR" "AWS credentials are invalid or expired"
    fi
}

# Validate Docker configuration
validate_docker_config() {
    validate_command_exists docker
    
    log_info "Validating Docker daemon..."
    if ! docker info > /dev/null 2>&1; then
        throw_error "RESOURCE_ERROR" "Docker daemon is not running or accessible"
    fi
}

# Validate Kubernetes configuration
validate_kube_config() {
    validate_command_exists kubectl
    
    log_info "Validating Kubernetes connection..."
    if ! kubectl cluster-info > /dev/null 2>&1; then
        throw_error "RESOURCE_ERROR" "Kubernetes cluster is not accessible"
    fi
}

# Function to send error notifications
send_error_notification() {
    local error_message="$1"
    local context="${2:-CI/CD Pipeline}"
    
    log_error "Sending error notification: $error_message"
    
    # Example: Send to Slack
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"❌ $context Error: $error_message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    # Example: Send to JIRA
    if [ -n "${JIRA_ISSUE_KEY:-}" ] && [ -n "${JIRA_API_TOKEN:-}" ]; then
        local comment="{\"body\":\"CI/CD Pipeline failed: $error_message\"}"
        curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
            -X POST -H "Content-Type: application/json" \
            -d "$comment" \
            "$JIRA_BASE_URL/rest/api/3/issue/$JIRA_ISSUE_KEY/comment" || true
    fi
}

# Main error handling setup
init_error_handling() {
    set_error_trap
    log_debug "Error handling system initialized"
}

# Export functions for use in other scripts
export -f set_error_trap validate_not_empty validate_file_exists
export -f validate_directory_exists validate_command_exists throw_error
export -f retry with_timeout safe_exec check_exit_code
export -f validate_required_vars validate_aws_config validate_docker_config
export -f validate_kube_config send_error_notification init_error_handling