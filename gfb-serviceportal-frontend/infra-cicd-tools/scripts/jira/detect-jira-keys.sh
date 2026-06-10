#!/bin/bash

# =============================================================================
# Detect JIRA Keys in Commit Messages
# =============================================================================
set -Eeuo pipefail


# Load utilities
UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../utils" && pwd)"
source "$UTILS_DIR/logging.sh"
source "$UTILS_DIR/error-handling.sh"
source "$UTILS_DIR/utils.sh"

# Init
init_utilities
start_timer

log_section "Iniciando proceso de JIRA"

# Validar conexión con JIRA
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/check-jira-connection.sh" || {
    log_error "❌ No se pudo establecer conexión con JIRA"
    exit 1
}

log_subsection "Detectando claves JIRA en commits"

# Extraer claves JIRA del último commit
COMMIT_MESSAGE=$(git log --pretty=format:"%s" -1 || echo "")
JIRA_KEYS=$(echo "$COMMIT_MESSAGE" | grep -oE '[A-Z]{2,}-[0-9]+' | sort -u)

log_info "📝 Mensaje del commit: $COMMIT_MESSAGE"
if [ -z "$JIRA_KEYS" ]; then
    log_warning "⚠️  No se encontraron claves JIRA en el mensaje de commit"
    exit 0
else
    log_info "🔑 Claves JIRA encontradas: $JIRA_KEYS"
fi

# Contadores
SUCCESS_COUNT=0
ERROR_COUNT=0

log_subsection "Procesando incidencias JIRA $JIRA_KEYS"

for issue_key in $JIRA_KEYS; do
    log_step "1" "Procesando incidencia: $issue_key"

    COMMENT="Se ha implementado un cambio relacionado con este issue. Commit: $COMMIT_MESSAGE [Pipeline: ${BITBUCKET_BUILD_NUMBER:-local}]"

    # Ejecutar el script y guardar código de salida
    "$SCRIPT_DIR/comment-jira.sh" "$issue_key" "$COMMENT"
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        log_success "Comentario agregado exitosamente a $issue_key"
        SUCCESS_COUNT=$((SUCCESS_COUNT+1))
    else
        log_error "Error al comentar en $issue_key (exit code $exit_code)"
        ERROR_COUNT=$((ERROR_COUNT+1))
    fi
done

# Resumen final
log_subsection "Resumen"
log_info "Comentarios exitosos: $SUCCESS_COUNT"
log_info "Comentarios fallidos: $ERROR_COUNT"

log_duration "Detección y comentario en JIRA"

# Salida con código correcto solo si no hubo errores
if [ "$ERROR_COUNT" -gt 0 ]; then
    exit 1
else
    exit 0
fi