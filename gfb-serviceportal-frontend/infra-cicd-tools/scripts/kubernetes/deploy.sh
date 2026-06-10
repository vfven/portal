#!/bin/bash

# Script universal para desplegar con templates
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

# Cargar variables
source .env || true

# Parámetros
APP_NAME="${1:-${APP_NAME:-my-app}}"
ENVIRONMENT="${2:-${ENVIRONMENT:-development}}"
IMAGE_TAG="${3:-${IMAGE_TAG:-latest}}"
PLATFORM="${4:-${PLATFORM:-rancher-local}}"
DRY_RUN="${5:-}"

# Exportar variables para envsubst
export APP_NAME ENVIRONMENT IMAGE_TAG PLATFORM
export IMAGE_REPO="${IMAGE_REPO:-localhost:5000/$APP_NAME}"
export APP_PORT="${APP_PORT:-3000}"
export REPLICAS="${REPLICAS:-1}"
export MIN_REPLICAS="${MIN_REPLICAS:-1}"
export MAX_REPLICAS="${MAX_REPLICAS:-3}"
export VERSION="${VERSION:-$IMAGE_TAG}"
export NAMESPACE="${NAMESPACE:-$ENVIRONMENT}"

# Generar manifiestos
log "Generando manifiestos para $APP_NAME en $ENVIRONMENT..."
"$DIR/generate-manifests.sh"

# Directorio de manifiestos generados
MANIFESTS_DIR="./manifests/${APP_NAME}-${ENVIRONMENT}"

if [ "$DRY_RUN" = "dry-run" ]; then
    echo "📋 Dry run - Manifiestos generados:"
    cat "$MANIFESTS_DIR"/*.yaml
else
    # Aplicar manifiestos
    kubectl apply -f "$MANIFESTS_DIR/" --record
    kubectl rollout status deployment/$APP_NAME --timeout=300s
    success "Despliegue de $APP_NAME completado! 🎉"
fi