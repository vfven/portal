#!/bin/bash

set -euo pipefail

# =============================================================================
# Load utilities
# =============================================================================
UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"

init_logging
init_error_handling
init_utilities
start_timer

# =============================================================================
# Directorios del repo y temporales
# =============================================================================
BASE_DIR="$(cd "/opt/atlassian/pipelines/agent/build" && pwd)"
K8S_REPO_DIR="$BASE_DIR/kubernetes"

OVERLAY_DIR="$K8S_REPO_DIR/overlays/$DEPLOY_ENV"
if [[ ! -d "$OVERLAY_DIR" ]]; then
    log_error "❌ No existe kubernetes/overlays/$DEPLOY_ENV"
    exit 1
fi

# =============================================================================
# Cargar metadata ECR
# =============================================================================
ECR_INFO_FILE="$BASE_DIR/ecr-push-info.txt"

if [[ -f "$ECR_INFO_FILE" ]]; then
    log_info "Usando metadata de ECR"
    source "$ECR_INFO_FILE"
fi

export IMAGE_FULL="${ECR_IMAGE_URI:-${APP_NAME}:${IMAGE_TAG}}"
log_info "Imagen final para manifest: $IMAGE_FULL"

# =============================================================================
# Actualizar tag y repo dentro del kustomization.yaml
# =============================================================================

KUSTOM_FILE="$K8S_REPO_DIR/overlays/$DEPLOY_ENV/kustomization.yaml"

if [[ ! -f "$KUSTOM_FILE" ]]; then
    log_error "❌ No existe $KUSTOM_FILE — no se puede actualizar la imagen."
    exit 1
fi

log_info "🔧 Actualizando imagen en kustomization.yaml..."

# newName → mantiene el ECR repo
sed -i "s|newName:.*|newName: ${ECR_REPO_NAME}|g" "$KUSTOM_FILE"

# newTag → siempre entre comillas
sed -i "s|newTag:.*|newTag: \"${IMAGE_TAG}\"|g" "$KUSTOM_FILE"

log_info "✔ Imagen actualizada en overlay $DEPLOY_ENV"

# =============================================================================
# Render con kustomize
# =============================================================================
KUSTOMIZE_RENDER_DIR="/tmp/kustomize_$DEPLOY_ENV"
mkdir -p "$KUSTOMIZE_RENDER_DIR"

log_info "Ejecutando kustomize build..."
kustomize build "$OVERLAY_DIR" > "$KUSTOMIZE_RENDER_DIR/all.yaml"

# =============================================================================
# Separación de recursos
# =============================================================================
FINAL_MANIFEST_DIR="$BASE_DIR/artifacts/k8s/$DEPLOY_ENV"
mkdir -p "$FINAL_MANIFEST_DIR"

cd "$KUSTOMIZE_RENDER_DIR"

log_info "Separando manifiestos..."
csplit -f res- -b "%02d.yaml" all.yaml '/^---$/' '{*}' || true

for f in res*.yaml; do
    KIND=$(grep -m1 "^kind:" "$f" | awk '{print tolower($2)}')

    case "$KIND" in
        deployment)      mv "$f" "$FINAL_MANIFEST_DIR/deployment.yaml" ;;
        service)         mv "$f" "$FINAL_MANIFEST_DIR/service.yaml" ;;
        ingress)         mv "$f" "$FINAL_MANIFEST_DIR/ingress.yaml" ;;
        secret)          mv "$f" "$FINAL_MANIFEST_DIR/secret.yaml" ;;
        configmap)       mv "$f" "$FINAL_MANIFEST_DIR/configmap.yaml" ;;
        horizontalpodautoscaler) mv "$f" "$FINAL_MANIFEST_DIR/hpa.yaml" ;;
        *) mv "$f" "$FINAL_MANIFEST_DIR/${KIND}.yaml" ;;
    esac
done

log_success "Manifiestos generados: $FINAL_MANIFEST_DIR"

# =============================================================================
# ZIP
# =============================================================================
ZIP_FILE="$BASE_DIR/artifacts/k8s-manifests-$DEPLOY_ENV.zip"
zip -j "$ZIP_FILE" "$FINAL_MANIFEST_DIR"/*

log_success "ZIP generado: $ZIP_FILE"