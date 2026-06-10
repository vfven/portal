#!/bin/bash

# =============================================================================
# Comment on JIRA Issue Script
# =============================================================================
set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../utils" && pwd)"
source "$UTILS_DIR/logging.sh"
source "$UTILS_DIR/error-handling.sh"
source "$UTILS_DIR/utils.sh"

init_utilities
start_timer

log_subsection "Comentar en incidencia JIRA"

# Validar parámetros
if [ $# -lt 2 ]; then
    throw_error "USAGE_ERROR" "Uso: $0 <JIRA_ISSUE_KEY> <COMENTARIO>"
fi

ISSUE_KEY="$1"
COMMENT="$2"

validate_required_vars JIRA_BASE_URL JIRA_USERNAME JIRA_API_TOKEN

# Validar formato del issue key
if ! echo "$ISSUE_KEY" | grep -qE '^[A-Z]+-[0-9]+$'; then
    throw_error "INVALID_KEY" "Clave de issue inválida: $ISSUE_KEY"
fi

log_info "Incidencia: $ISSUE_KEY"
log_info "Comentario: $COMMENT"

API_VERSIONS=("2" "3")
success=false

for api_version in "${API_VERSIONS[@]}"; do
    log_step "1" "Probando con API v$api_version"

    if [ "$api_version" = "2" ]; then
        JSON_DATA="{\"body\": \"$COMMENT\"}"
    else
        JSON_DATA="{\"body\":{\"type\":\"doc\",\"version\":1,\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"$COMMENT\"}]}]}}"
    fi

    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$JSON_DATA" \
        "$JIRA_BASE_URL/rest/api/$api_version/issue/$ISSUE_KEY/comment")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -eq 201 ]; then
        log_success "Comentario agregado exitosamente en $ISSUE_KEY (API v$api_version)"
        success=true
        break
    else
        log_warning "Error $http_code en API v$api_version"
    fi
done

if ! $success; then
    throw_error "COMMENT_ERROR" "No se pudo agregar comentario a $ISSUE_KEY"
fi

log_duration "Comentario en JIRA"