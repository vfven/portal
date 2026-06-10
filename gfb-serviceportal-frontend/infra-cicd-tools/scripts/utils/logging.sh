#!/bin/bash

# =============================================================================
# Advanced Logging Utilities for CI/CD Scripts
# =============================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Log levels
LOG_LEVEL_DEBUG="DEBUG"
LOG_LEVEL_INFO="INFO"
LOG_LEVEL_WARN="WARN"
LOG_LEVEL_ERROR="ERROR"
LOG_LEVEL="${LOG_LEVEL:-INFO}"

# Timestamp function
timestamp() {
    date +"%Y-%m-%d %H:%M:%S.%3N"
}

# Function to check if log level is enabled
is_log_level_enabled() {
    local level="$1"
    declare -A level_weights=(
        ["DEBUG"]=0
        ["INFO"]=1
        ["WARN"]=2
        ["ERROR"]=3
    )
    
    local current_weight=${level_weights[$LOG_LEVEL]}
    local message_weight=${level_weights[$level]}
    
    [ $message_weight -ge $current_weight ]
}

# Debug logging
log_debug() {
    if is_log_level_enabled "DEBUG"; then
        echo -e "${CYAN}[$(timestamp)] [DEBUG]${NC} $1" >&2
    fi
}

# Info logging
log_info() {
    if is_log_level_enabled "INFO"; then
        echo -e "${BLUE}[$(timestamp)] [INFO]${NC} $1" >&2
    fi
}

# Success logging
log_success() {
    if is_log_level_enabled "INFO"; then
        echo -e "${GREEN}[$(timestamp)] [SUCCESS]${NC} $1" >&2
    fi
}

# Warning logging
log_warning() {
    if is_log_level_enabled "WARN"; then
        echo -e "${YELLOW}[$(timestamp)] [WARN]${NC} $1" >&2
    fi
}

# Error logging
log_error() {
    if is_log_level_enabled "ERROR"; then
        echo -e "${RED}[$(timestamp)] [ERROR]${NC} $1" >&2
    fi
}

# Section header
log_section() {
    local section_name="$1"
    echo -e "${MAGENTA}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                     $section_name                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Subsection header
log_subsection() {
    local subsection_name="$1"
    echo -e "${CYAN}"
    echo "════════════════════════════════════════════════════════════"
    echo "  $subsection_name"
    echo "════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

# Step logging
log_step() {
    local step_number="$1"
    local step_description="$2"
    echo -e "${WHITE}Step $step_number: ${step_description}${NC}"
}

# Command logging with execution
log_command() {
    local command="$1"
    log_debug "Executing: $command"
    eval "$command"
}

# Duration logging
start_timer() {
    export START_TIME=$(date +%s)
}

log_duration() {
    local operation_name="$1"
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    if [ $duration -ge 60 ]; then
        local minutes=$((duration / 60))
        local seconds=$((duration % 60))
        log_info "$operation_name completed in ${minutes}m ${seconds}s"
    else
        log_info "$operation_name completed in ${duration}s"
    fi
}

# JSON logging for machine parsing
log_json() {
    local level="$1"
    local message="$2"
    local additional_fields="$3"
    
    if [ "$LOG_FORMAT" = "json" ]; then
        local log_entry="{\"timestamp\":\"$(timestamp)\",\"level\":\"$level\",\"message\":\"$message\""
        
        if [ -n "$additional_fields" ]; then
            log_entry="$log_entry,$additional_fields"
        fi
        
        log_entry="$log_entry}"
        echo "$log_entry"
    else
        case "$level" in
            "DEBUG") log_debug "$message" ;;
            "INFO") log_info "$message" ;;
            "WARN") log_warning "$message" ;;
            "ERROR") log_error "$message" ;;
            *) log_info "$message" ;;
        esac
    fi
}

# Log environment variables (masking secrets)
log_environment() {
    log_debug "Environment variables:"
    env | grep -E -i '(app|aws|jira|docker|kube)' | \
    while read -r line; do
        local var_name=$(echo "$line" | cut -d'=' -f1)
        local var_value=$(echo "$line" | cut -d'=' -f2-)
        
        # Mask sensitive values
        case "$var_name" in
            *KEY* | *TOKEN* | *SECRET* | *PASSWORD* | *ACCESS* | *PRIVATE*)
                var_value="***MASKED***"
                ;;
            *)
                # Show first 4 chars for non-sensitive values
                if [ "${#var_value}" -gt 8 ]; then
                    var_value="${var_value:0:4}***${var_value: -4}"
                fi
                ;;
        esac
        
        log_debug "  $var_name=$var_value"
    done
}

# Initialize logging
init_logging() {
    log_debug "Logging system initialized"
    log_debug "Log level: $LOG_LEVEL"
    log_debug "Log format: ${LOG_FORMAT:-text}"
}

# Export functions for use in other scripts
export -f timestamp log_debug log_info log_success log_warning log_error
export -f log_section log_subsection log_step log_command
export -f start_timer log_duration log_json log_environment init_logging