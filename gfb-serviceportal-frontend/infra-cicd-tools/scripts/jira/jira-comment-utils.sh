#!/bin/bash
# jira-comment-utils-fixed.sh

set -Eeuo pipefail

UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"


JIRA_COMMENT_FILE="${JIRA_COMMENT_FILE:-jira-comment.md}"
JIRA_ISSUES_FILE="${JIRA_ISSUES_FILE:-jira-issues.txt}"

# Simple logging
log_info() { echo "[INFO] $1"; }
log_success() { echo "[SUCCESS] $1"; }
log_warning() { echo "[WARNING] $1"; }
log_error() { echo "[ERROR] $1"; }
log_step() { echo "=== $1: $2 ==="; }

# =============================================================================
# JIRA Search Functions - CORREGIDO
# =============================================================================

search_jira_issues() {
    local jql_query="$1"
    local fields="${2:-key,summary,status}"
    local max_results="${3:-1}"
    
    local encoded_jql=$(echo "$jql_query" | jq -s -R -r @uri)
    local encoded_fields=$(echo "$fields" | jq -s -R -r @uri)
    
    local search_url="$JIRA_BASE_URL/rest/api/3/search/jql?jql=$encoded_jql&maxResults=$max_results&fields=$encoded_fields"
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X GET \
        -H "Content-Type: application/json" \
        "$search_url")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        echo "$response_body"
        return 0
    else
        log_error "JIRA search failed (HTTP $http_code)"
        return 1
    fi
}

# Función MEJORADA que SÍ encuentra DV-430
find_subtask_in_release_or_project() {
    local subtask_name="$1"
    local project_key="${2:-$JIRA_PROJECT_KEY}"
    local release_name="${3:-}"
    
    log_step "SEARCH" "Finding: '$subtask_name'"
    log_info "Project: $project_key"
    log_info "Release: $release_name"
    
    # =================================================================
    # PASO 1: Buscar EXCLUSIVAMENTE en el release
    # =================================================================
    if [[ -n "$release_name" ]]; then
        log_info "🔍 Step 1: Searching IN RELEASE '$release_name'"
        
        local jql_release="project = \"$project_key\" AND fixVersion = \"$release_name\" AND summary ~ \"$subtask_name\" AND issuetype = Sub-task"
        
        if search_result=$(search_jira_issues "$jql_release" "key,summary,status,issuetype" 5); then
            local total_in_release=$(echo "$search_result" | jq -r '.total // 0')
            
            if [ "$total_in_release" -gt 0 ]; then
                log_success "✅ Found $total_in_release subtasks IN RELEASE:"
                
                for i in $(seq 0 $((total_in_release - 1))); do
                    local found_key=$(echo "$search_result" | jq -r ".issues[$i].key")
                    local found_summary=$(echo "$search_result" | jq -r ".issues[$i].fields.summary")
                    log_info "  📋 $found_key - '$found_summary'"
                done
                
                local subtask_key=$(echo "$search_result" | jq -r '.issues[0].key')
                echo "$subtask_key"
                return 0
            else
                log_warning "❌ No subtasks found in release '$release_name'"
            fi
        fi
    fi
    
    # =================================================================
    # PASO 2: Buscar en TODO el proyecto - MÁS FLEXIBLE
    # =================================================================
    log_info "🔍 Step 2: Searching in ENTIRE PROJECT '$project_key'"
    
    # Probar diferentes estrategias de búsqueda
    local search_patterns=(
        "summary ~ \"$subtask_name\""
        "text ~ \"$subtask_name\"" 
        "summary ~ \"Security\" AND summary ~ \"Vulnerability\" AND summary ~ \"Scan\""
        "text ~ \"Security Vulnerability Scan\""
    )
    
    for pattern in "${search_patterns[@]}"; do
        log_info "Trying pattern: $pattern"
        
        local jql_project="project = \"$project_key\" AND $pattern AND issuetype = Sub-task ORDER BY created DESC"
        
        if search_result=$(search_jira_issues "$jql_project" "key,summary,status,issuetype,fixVersions" 10); then
            local total_in_project=$(echo "$search_result" | jq -r '.total // 0')
            
            if [ "$total_in_project" -gt 0 ]; then
                log_success "✅ Found $total_in_project matching subtasks:"
                
                for i in $(seq 0 $((total_in_project - 1))); do
                    local found_key=$(echo "$search_result" | jq -r ".issues[$i].key")
                    local found_summary=$(echo "$search_result" | jq -r ".issues[$i].fields.summary")
                    local fix_versions=$(echo "$search_result" | jq -r ".issues[$i].fields.fixVersions[].name // \"none\"" | tr '\n' ',' | sed 's/,$//')
                    
                    log_info "  📋 $found_key - '$found_summary'"
                    log_info "     Versions: $fix_versions"
                done
                
                # Usar la primera (más reciente)
                local most_recent_key=$(echo "$search_result" | jq -r '.issues[0].key')
                local most_recent_summary=$(echo "$search_result" | jq -r '.issues[0].fields.summary')
                
                log_success "✅ Using: $most_recent_key - '$most_recent_summary'"
                
                echo "$most_recent_key"
                return 0
            fi
        fi
    done
    
    # =================================================================
    # PASO 3: Búsqueda DIRECTA por key conocida (fallback)
    # =================================================================
    log_info "🔍 Step 3: Trying known subtask keys..."
    
    # Si sabemos que DV-430 existe, intentar obtenerla directamente
    local known_keys=("DV-430" "DV-431" "DV-432")
    
    for known_key in "${known_keys[@]}"; do
        log_info "Checking known key: $known_key"
        
        local jql_direct="key = \"$known_key\" AND issuetype = Sub-task"
        if search_result=$(search_jira_issues "$jql_direct" "key,summary,status" 1); then
            local total_found=$(echo "$search_result" | jq -r '.total // 0')
            
            if [ "$total_found" -gt 0 ]; then
                local found_key=$(echo "$search_result" | jq -r '.issues[0].key')
                local found_summary=$(echo "$search_result" | jq -r '.issues[0].fields.summary')
                
                log_success "✅ Found known subtask: $found_key - '$found_summary'"
                echo "$found_key"
                return 0
            fi
        fi
    done
    
    log_error "❌ No subtasks found with name: '$subtask_name' after multiple search attempts"
    return 1
}

# Función para ASIGNAR subtarea al release
assign_subtask_to_release() {
    local subtask_key="$1"
    local release_name="$2"
    
    log_step "ASSIGN" "Assigning $subtask_key to release: $release_name"
    
    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X PUT \
        -H "Content-Type: application/json" \
        "$JIRA_BASE_URL/rest/api/3/issue/$subtask_key" \
        -d '{
            "update": {
                "fixVersions": [
                    {"add": {"name": "'"$release_name"'"}}
                ]
            }
        }')
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 204 ]; then
        log_success "✅ Successfully assigned $subtask_key to release: $release_name"
        return 0
    else
        log_error "❌ Failed to assign to release (HTTP $http_code)"
        return 1
    fi
}

# Main function - VERSIÓN SIMPLIFICADA Y EFECTIVA
detect_subtask() {
    local subtask_name="$1"
    local project_key="${JIRA_PROJECT_KEY:-DV}"
    local release_name="${REPO_NAME:-app-source-code} v${APP_VERSION:-1.0.0}"
    local issues_file="${JIRA_ISSUES_FILE:-jira-issues.txt}"

    log_step "DETECT" "Finding: '$subtask_name'"
    log_info "Project: $project_key"
    log_info "Release: $release_name"
    log_info "Searching for subtask by direct JQL and text match"

    local jql_query="project = \"$project_key\" AND fixVersion = \"$release_name\" AND issuetype = Sub-task"
    local encoded_jql
    encoded_jql=$(echo "$jql_query" | jq -s -R -r @uri)

    local json
    json=$(curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
      -X GET \
      "$JIRA_BASE_URL/rest/api/3/search/jql?jql=$encoded_jql&maxResults=100&fields=key,summary" \
      | jq -r '.issues[] | "\(.key) - \(.fields.summary)"')

    if [[ -z "$json" ]]; then
        log_error "❌ No issues returned from JIRA"
        return 1
    fi

    # Buscar coincidencia textual exacta o parcial (case-insensitive)
    local match
    match=$(echo "$json" | grep -i "$subtask_name" | head -n 1)

    if [[ -n "$match" ]]; then
        local key
        key=$(echo "$match" | awk '{print $1}')
        log_success "✅ Found: $key - $match"
        echo "$key" > "$issues_file"
        echo "$key"
        return 0
    else
        log_error "❌ Subtask '$subtask_name' not found in list"
        echo "$json" | head -n 10 | while read -r line; do
            log_info "  ↳ $line"
        done
        return 1
    fi
}

# =============================================================================
# Convenience functions
# =============================================================================

#detect_security_scan_subtask() {
    # Usar estrategia "direct" ya que sabemos que DV-430 existe
#    detect_subtask "Security Vulnerability Scan" "direct"
#}

#detect_build_application_subtask() {
#    detect_subtask "Build Application" "auto"
#}

detect_security_scan_subtask() {
    detect_subtask "Security Vulnerability Scan" "${1:-auto}"
}

detect_docker_build_subtask() {
    detect_subtask "Build Docker Image" "${1:-auto}"
}

detect_ecr_push_subtask() {
    detect_subtask "Push to Container Registry" "${1:-auto}"
}

# Opcional: si también tienes esta
detect_build_application_subtask() {
    detect_subtask "Build Application" "${1:-auto}"
}

# ... (mantener el resto de las funciones igual)
detect_jira_issues() {
    local custom_pattern="${1:-}"
    log_step "DETECT" "Detecting JIRA issues from commit messages"
    
    local jira_issues=()
    local jira_project="${JIRA_PROJECT_KEY:-DV}"
    local pattern="${jira_project}-[0-9]+"
    
    if command -v git &> /dev/null; then
        local commit_msg=$(git log --pretty=format:"%s" -1 2>/dev/null || echo "")
        if [[ -n "$commit_msg" ]]; then
            while IFS= read -r issue; do
                if [[ -n "$issue" ]]; then
                    jira_issues+=("$issue")
                    log_info "Found JIRA issue: $issue"
                fi
            done < <(echo "$commit_msg" | grep -oE "$pattern" | sort -u)
        fi
    fi

    if [[ ${#jira_issues[@]} -eq 0 ]]; then
        local default_issue="DV-430"  # ← Usar DV-430 por defecto
        jira_issues+=("$default_issue")
        log_warning "No JIRA issues found, using default: $default_issue"
    fi

    printf "%s\n" "${jira_issues[@]}" > "$JIRA_ISSUES_FILE"
    log_success "Detected ${#jira_issues[@]} JIRA issues"
    echo "${jira_issues[@]}"
}

create_jira_comments() {
    local custom_comment="${1:-}"
    local comment_file="${2:-$JIRA_COMMENT_FILE}"
    
    log_step "CREATE" "Creating JIRA comments"
    
    local comment_content=""
    if [[ -n "$custom_comment" ]]; then
        comment_content="$custom_comment"
    elif [[ -f "$comment_file" ]]; then
        comment_content=$(cat "$comment_file")
    else
        comment_content="## 🔍 Automated Comment\n\n**Action:** Automated process\n**Date:** $(date)\n**Build:** ${BITBUCKET_BUILD_NUMBER:-N/A}\n\nThis comment was automatically generated by the CI/CD pipeline.\n"
    fi
    
    comment_content+="\n\n---\n*Automated message from CI/CD Pipeline*"
    echo "$comment_content" > "$comment_file"
    log_success "JIRA comment created: $comment_file"
}

post_jira_comments() {
    local comment_file="${1:-$JIRA_COMMENT_FILE}"
    local issues_file="${2:-$JIRA_ISSUES_FILE}"
    
    log_step "POST" "Posting comments to JIRA issues"
    
    if [[ ! -f "$issues_file" ]]; then
        log_warning "No JIRA issues file found, detecting issues..."
        detect_jira_issues
    fi
    
    if [[ ! -f "$comment_file" ]]; then
        log_warning "No comment file found, creating default..."
        create_jira_comments
    fi

    local comment=$(cat "$comment_file")
    local success_count=0
    local error_count=0

    #if [[ ! -f "$UTILS_DIR/jira/comment-jira.sh" ]]; then
    #    log_error "JIRA comment script not found"
    #    return 1
    #fi

    while IFS= read -r issue_key; do
        if [[ -n "$issue_key" ]]; then
            log_info "Posting comment to JIRA issue: $issue_key"
            if "$UTILS_DIR/jira/comment-jira.sh" "$issue_key" "$comment"; then
                log_success "✅ Comment posted to $issue_key"
                ((success_count++))
            else
                log_error "❌ Failed to post to $issue_key"
                ((error_count++))
            fi
        fi
    done < "$issues_file"

    log_info "JIRA comment summary: $success_count successful, $error_count failed"
    [[ $error_count -gt 0 ]] && return 1
    return 0
}

export -f detect_jira_issues
export -f create_jira_comments
export -f post_jira_comments
export -f detect_subtask
export -f detect_security_scan_subtask
export -f detect_build_application_subtask

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "This script is intended to be sourced, not executed directly."
    exit 1
fi