#!/bin/bash

# =============================================================================
# General Utilities for CI/CD Scripts
# =============================================================================

# Load logging and error handling
source infra-cicd-tools/scripts/utils/logging.sh
source infra-cicd-tools/scripts/utils/error-handling.sh

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                export LOG_LEVEL="DEBUG"
                log_debug "Verbose mode enabled"
                ;;
            --json)
                export LOG_FORMAT="json"
                ;;
            --app-name=*)
                export APP_NAME="${1#*=}"
                ;;
            --env=*)
                export ENVIRONMENT="${1#*=}"
                ;;
            --tag=*)
                export IMAGE_TAG="${1#*=}"
                ;;
            *)
                log_warning "Unknown parameter: $1"
                ;;
        esac
        shift
    done
}

# Show help information
show_help() {
    echo "CI/CD Script Utilities"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -v, --verbose       Enable verbose logging"
    echo "  --json              Output logs in JSON format"
    echo "  --app-name=NAME     Set application name"
    echo "  --env=ENV           Set environment (dev, staging, prod)"
    echo "  --tag=TAG           Set image tag"
}

# Function to load configuration
load_config() {
    local config_file="${1:-.env}"
    
    if [ -f "$config_file" ]; then
        log_info "Loading configuration from $config_file"
        # Safe source of .env file
        while IFS= read -r line; do
            if [[ $line =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
                export "$line"
            fi
        done < "$config_file"
    else
        log_warning "Config file not found: $config_file"
    fi
}

# Function to mask secrets in output
mask_secrets() {
    local text="$1"
    # Mask AWS keys
    text=$(echo "$text" | sed -E 's/(AKIA[0-9A-Z]{16})/***MASKED***/g')
    # Mask JWT tokens
    text=$(echo "$text" | sed -E 's/(eyJhbGciOiJ[^.]+\.[^.]+\.[^.]+\.[^.]+)/***MASKED***/g')
    # Mask generic tokens
    text=$(echo "$text" | sed -E 's/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/***MASKED***/g')
    echo "$text"
}

# Function to generate random string
generate_random_string() {
    local length="${1:-12}"
    tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c "$length"
}

# Function to wait for resource
wait_for_resource() {
    local resource_type="$1"
    local resource_name="$2"
    local namespace="${3:-}"
    local timeout="${4:-300}"
    local interval="${5:-5}"
    
    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))
    
    log_info "Waiting for $resource_type/$resource_name to be ready..."
    
    while [ $(date +%s) -lt $end_time ]; do
        local command="kubectl get $resource_type $resource_name"
        if [ -n "$namespace" ]; then
            command="$command -n $namespace"
        fi
        command="$command -o jsonpath='{.status.conditions[?(@.type==\"Ready\")].status}'"
        
        if [ "$(eval "$command")" = "True" ]; then
            log_success "$resource_type/$resource_name is ready"
            return 0
        fi
        
        sleep $interval
        log_info "Still waiting... $((end_time - $(date +%s)))s remaining"
    done
    
    throw_error "TIMEOUT_ERROR" "Timeout waiting for $resource_type/$resource_name to be ready"
}

# Initialize utilities
init_utilities() {
    init_logging
    log_debug "Utilities system initialized"
}

# Export functions
export -f parse_args show_help load_config mask_secrets
export -f generate_random_string wait_for_resource init_utilities