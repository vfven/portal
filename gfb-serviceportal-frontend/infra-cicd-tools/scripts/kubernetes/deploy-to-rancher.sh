#!/bin/bash

# =============================================================================
# Script para despliegue en Rancher desde Bitbucket usando utilidades
# =============================================================================

set -euo pipefail

# ===============================
# Load utilities
# ===============================
source infra-cicd-tools/scripts/utils/logging.sh
source infra-cicd-tools/scripts/utils/error-handling.sh
source infra-cicd-tools/scripts/utils/utils.sh

# Inicializar logging y manejo de errores
init_logging
init_error_handling
init_utilities
start_timer

log_section "DESPLIEGUE EN RANCHER"

# ===============================
# Variables
# ===============================
APP_NAME="${APP_NAME:-PROD_ENVIRONMENT}"
ENVIRONMENT="${DEV_ENVIRONMENT:-PROD_ENVIRONMENT}"
#IMAGE_TAG="${3:-latest}"
MANIFESTS_DIR="./kubernetes-manifests/generated/${APP_NAME}-${ENVIRONMENT}"

log_info "App: $APP_NAME | Env: $ENVIRONMENT | Tag: $IMAGE_TAG | Manifests: $MANIFESTS_DIR"

# ===============================
# Validar directorio de manifiestos
# ===============================
validate_directory_exists "$MANIFESTS_DIR" "No se encontraron manifiestos en: $MANIFESTS_DIR"

# ===============================
# Usar contexto de Rancher si está definido
# ===============================
if [ -n "${KUBE_CONTEXT:-}" ]; then
    log_info "Usando contexto de Kubernetes: $KUBE_CONTEXT"
    safe_exec "kubectl config use-context \"$KUBE_CONTEXT\"" "Error al cambiar al contexto $KUBE_CONTEXT"
fi

# ===============================
# Desplegar manifiestos
# ===============================
log_subsection "Aplicando manifiestos de Kubernetes..."
safe_exec "kubectl apply -f \"$MANIFESTS_DIR/\" --record" "Error aplicando manifiestos"

# ===============================
# Esperar rollout de deployment
# ===============================
log_subsection "Esperando rollout de deployment..."
safe_exec "kubectl rollout status deployment/$APP_NAME -n $ENVIRONMENT --timeout=300s" "Error durante el rollout del deployment $APP_NAME"

log_success "Despliegue de $APP_NAME ($IMAGE_TAG) en Rancher ($ENVIRONMENT) completado!"
log_duration "Despliegue Rancher"