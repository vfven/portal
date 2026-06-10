#!/bin/bash

# =============================================================================
# Check JIRA Connection Script
# =============================================================================
set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../utils" && pwd)"
source "$UTILS_DIR/logging.sh"
source "$UTILS_DIR/error-handling.sh"
source "$UTILS_DIR/utils.sh"

init_utilities
start_timer

log_subsection "Validando conexión con JIRA"

# Validar variables de entorno requeridas
validate_required_vars JIRA_BASE_URL JIRA_USERNAME JIRA_API_TOKEN

log_info "Variables configuradas correctamente"
log_info "   JIRA_BASE_URL: $JIRA_BASE_URL"
log_info "   JIRA_USERNAME: $JIRA_USERNAME"
log_info "   JIRA_API_TOKEN: ${JIRA_API_TOKEN:0:4}******"

# Endpoints a probar
endpoints=(
    "/rest/api/2/myself"
    "/rest/api/3/myself"
    "/rest/api/2/application-properties"
    "/status"
)

success=false
for endpoint in "${endpoints[@]}"; do
    log_step "1" "Probando endpoint: $endpoint"

    response=$(curl -s -w "\n%{http_code}" -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
        -X GET "$JIRA_BASE_URL$endpoint")

    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 200 ]; then
        log_success "Conexión exitosa con $endpoint"
        if [[ "$endpoint" == *"myself"* ]]; then
            user_displayName=$(echo "$response_body" | grep -o '"displayName":"[^"]*' | cut -d'"' -f4)
            user_email=$(echo "$response_body" | grep -o '"emailAddress":"[^"]*' | cut -d'"' -f4)
            log_info "Usuario autenticado: $user_displayName ($user_email)"
        fi
        success=true
        break
    else
        log_warning "Error $http_code en $endpoint"
    fi
done

if ! $success; then
    throw_error "JIRA_CONNECTION_ERROR" "No se pudo establecer conexión con JIRA"
fi

log_duration "Validación de conexión JIRA"