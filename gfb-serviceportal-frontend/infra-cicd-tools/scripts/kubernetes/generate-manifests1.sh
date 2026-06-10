#!/bin/bash

# =============================================================================
# Script para generar manifiestos Kubernetes desde templates usando utilidades
# =============================================================================


# ===============================
# Load utilities
# ===============================
set -euo pipefail

# --- Librerías comunes ---
UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"

# Inicializar logging y manejo de errores
init_logging
init_error_handling
init_utilities
start_timer

log_section "GENERACIÓN DE MANIFIESTOS KUBERNETES"

# ===============================
# Directorios y variables
# ===============================
#TEMPLATES_DIR="infra-cicd-tools/templates/kubernetes-manifiest"
#OUTPUT_DIR="./kubernetes-manifests/generated/${APP_NAME:-hola-mundo}-${ENVIRONMENT:-development}"

# Validar que el directorio de templates exista
#validate_directory_exists "$TEMPLATES_DIR" "Templates directory not found: $TEMPLATES_DIR"

# Crear y validar el directorio de output
#mkdir -p "$OUTPUT_DIR"
#validate_directory_exists "$OUTPUT_DIR" "Failed to create or access output directory: $OUTPUT_DIR"

#export APP_NAME="${APP_NAME:-hola-mundo}"
#export DEPLOY_ENV="${DEPLOY_ENV:-development}"
#export IMAGE_TAG="${IMAGE_TAG:-latest}"
#export IMAGE_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${APP_NAME}"
#export APP_PORT="${APP_PORT:-3000}"
#export REPLICAS="${REPLICAS:-1}"
#export VERSION="${VERSION:-$IMAGE_TAG}"
#export NAMESPACE="${NAMESPACE:-$DEPLOY_ENV}"

log_info "App: $APP_NAME | Env: $ENVIRONMENT | Image: $IMAGE_REPO:$IMAGE_TAG | Namespace: $K8S_NAMESPACE"

# ===============================
# Función para procesar templates
# ===============================
process_template() {
    local template_file="$1"
    local output_file="$2"

    if [ -f "$template_file" ]; then
        safe_exec "envsubst < \"$template_file\" > \"$output_file\"" "Error generando template: $template_file"
        log_success "Generado: $(basename "$output_file")"
    else
        log_warning "Template no encontrado: $template_file"
    fi
}

# ===============================
# Generar todos los manifiestos
# ===============================
log_subsection "Procesando templates de Kubernetes..."

for template in "$TEMPLATES_DIR"/*.tpl; do
    if [ -f "$template" ]; then
        filename=$(basename "$template" .tpl)
        process_template "$template" "$OUTPUT_DIR/$filename"
    fi
done

# ===============================
# Generar kustomization.yaml
# ===============================
log_subsection "Generando kustomization.yaml"

cat > "$OUTPUT_DIR/kustomization.yaml" << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
  - secret.yaml
  - hpa.yaml
  - ingress.yaml

namespace: $K8S_NAMESPACE

commonLabels:
  app: $APP_NAME
  environment: $ENVIRONMENT
  version: $IMAGE_TAG
EOF

log_success "Kustomization generado en: $OUTPUT_DIR"
log_info "Archivos generados:"
ls -la "$OUTPUT_DIR"

log_duration "Generación de manifiestos"




# --- Rutas principales ---
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
K8S_DIR="$BASE_DIR/kubernetes"
OVERLAYS_DIR="$K8S_DIR/overlays"
COMPONENTS_DIR="$K8S_DIR/components"
ENV_FILE="$BASE_DIR/.env"

# --- Determinar entorno según branch ---
BRANCH="${BITBUCKET_BRANCH:-develop}"
case "$BRANCH" in
  main|master) DEPLOY_ENV="prod" ;;
  develop|qa|development) DEPLOY_ENV="qa" ;;
  fix*|hotfix*|patch*) DEPLOY_ENV="fix" ;;
  *) DEPLOY_ENV="custom" ;;
esac

log_info "📦 Branch detectado: $BRANCH"
log_info "🌎 Entorno seleccionado: $DEPLOY_ENV"

# --- Validar archivos y carpetas ---
if [ ! -f "$ENV_FILE" ]; then
  log_error "No se encontró archivo .env en la raíz del repo"
  exit 1
fi

if [ ! -d "$OVERLAYS_DIR/$DEPLOY_ENV" ]; then
  log_warn "Overlay '$DEPLOY_ENV' no existe, creando desde plantilla QA..."
  mkdir -p "$OVERLAYS_DIR/$DEPLOY_ENV"
  cp -r "$OVERLAYS_DIR/qa/." "$OVERLAYS_DIR/$DEPLOY_ENV/"
fi

# --- Cargar variables globales y del entorno ---
chmod +x "$UTILS_DIR/utils/load-env.sh"
"$UTILS_DIR/utils/load-env.sh" "$DEPLOY_ENV"
source "$BASE_DIR/export_vars.sh"

if [ -f "$OVERLAYS_DIR/$DEPLOY_ENV/values.env" ]; then
  log_info "📄 Cargando variables locales de values.env (${DEPLOY_ENV})"
  set -a
  source "$OVERLAYS_DIR/$DEPLOY_ENV/values.env"
  set +a
fi

log_success "Variables cargadas correctamente para entorno: $DEPLOY_ENV"

# --- Verificar componentes habilitados ---
ENABLE_REDIS=${ENABLE_REDIS:-false}
ENABLE_ISTIO=${ENABLE_ISTIO:-false}

if [[ "$ENABLE_REDIS" == "true" ]]; then
  log_info "🧩 Agregando componente Redis..."
  yq eval '.resources += ["../../components/redis"]' -i "$OVERLAYS_DIR/$DEPLOY_ENV/kustomization.yaml"
fi

if [[ "$ENABLE_ISTIO" == "true" ]]; then
  log_info "🧩 Agregando componente Istio..."
  yq eval '.resources += ["../../components/istio"]' -i "$OVERLAYS_DIR/$DEPLOY_ENV/kustomization.yaml"
fi

# --- Generar manifiestos ---
OUTPUT_FILE="$K8S_DIR/manifests-${DEPLOY_ENV}.yaml"
log_info "🚀 Generando manifiestos con Kustomize..."
if kustomize build "$OVERLAYS_DIR/$DEPLOY_ENV" > "$OUTPUT_FILE"; then
  log_success "✅ Manifiestos generados: $OUTPUT_FILE"
else
  log_error "Error al generar manifiestos"
  exit 1
fi

# --- Validar kubectl ---
if ! kubectl version --client &>/dev/null; then
  log_error "kubectl no está configurado correctamente"
  exit 1
fi

# --- Aplicar manifiestos (opcional) ---
if [[ "${AUTO_DEPLOY:-false}" == "true" ]]; then
  log_info "🌍 Aplicando manifiestos en cluster..."
  kubectl apply -k "$OVERLAYS_DIR/$DEPLOY_ENV/"
  log_success "Despliegue aplicado exitosamente (${DEPLOY_ENV})"
else
  log_warn "AUTO_DEPLOY=false - Solo se generaron los manifiestos (sin aplicar)"
fi

# --- Copia de seguridad de variables (solo custom) ---
if [[ "$DEPLOY_ENV" == "custom" ]]; then
  cp "$ENV_FILE" "$OVERLAYS_DIR/custom/.env" || true
  log_info "📋 Copia del .env guardada en overlays/custom/.env"
fi

log_success "🎉 Proceso completado para entorno: $DEPLOY_ENV"