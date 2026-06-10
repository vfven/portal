#!/bin/bash

# =============================================================================
# Load environment values (unificado con override y branch detection)
# =============================================================================

set -euo pipefail

# === Importar librerías comunes ===
UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"

# Inicializar logging y manejo de errores
init_logging
init_error_handling
init_utilities
start_timer

# === Variables iniciales ===
ENV_FILE=".env"

# ========================================================================
# 1. DETECCIÓN DEL ENTORNO — OVERRIDE MANUAL > BRANCH
# ========================================================================

if [[ -n "${ENVIRONMENT:-}" ]]; then
    DEPLOY_ENV="$ENVIRONMENT"
    log_info "♻️ Override manual detectado — DEPLOY_ENV='$DEPLOY_ENV'"
else
    BRANCH="${BITBUCKET_BRANCH:-develop}"
    log_info "🔎 Detectando entorno a partir del branch: $BRANCH"

    case "$BRANCH" in
        main|master) DEPLOY_ENV="prod" ;;
        quality|qa)  DEPLOY_ENV="qa" ;;
        develop|dev) DEPLOY_ENV="dev" ;;
        staging|stage) DEPLOY_ENV="stage" ;;
        fix*|hotfix*) DEPLOY_ENV="fix" ;;
        *) DEPLOY_ENV="custom" ;;
    esac

    log_info "🌎 Entorno detectado automáticamente — DEPLOY_ENV='$DEPLOY_ENV'"
fi

# ========================================================================
# 2. DEFINIR PREFIJO SEGÚN EL ENTORNO FINAL
# ========================================================================
case "$DEPLOY_ENV" in
    dev|development)   PREFIX="DEV_" ;;
    qa|quality)        PREFIX="QA_" ;;
    prod|production)   PREFIX="PROD_" ;;
    stage|staging)     PREFIX="STAGE_" ;;
    fix)               PREFIX="FIX_" ;;
    *)
        PREFIX=""
        log_warn "⚠️ Entorno '$DEPLOY_ENV' no tiene prefijo asignado; solo se cargarán variables globales."
        ;;
esac

export DEPLOY_ENV
export PREFIX

log_info "🏷 Entorno final: $DEPLOY_ENV (prefijo: '$PREFIX')"

# ========================================================================
# 3. VALIDAR .env
# ========================================================================
if [ ! -f "$ENV_FILE" ]; then
    log_error "❌ No se encontró el archivo $ENV_FILE"
    exit 1
fi

log_info "📦 Cargando variables desde $ENV_FILE"

# ========================================================================
# 4. PROCESAR Y EXPORTAR VARIABLES
# ========================================================================

rm -f export_vars.sh
touch export_vars.sh

# ---------- (1) Exportar variables globales ----------
while IFS= read -r line; do
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue

    KEY=$(echo "$line" | cut -d '=' -f1)
    VALUE=$(echo "$line" | cut -d '=' -f2-)

    # Si NO está prefijada → es GLOBAL
    if [[ ! "$KEY" =~ ^(DEV_|QA_|PROD_|FIX_|STAGE_) ]]; then
        export "$KEY"="$VALUE"
        echo "export $KEY=\"$VALUE\"" >> export_vars.sh
    fi
done < "$ENV_FILE"

# ---------- (2) Exportar variables del ENV seleccionado ----------
if [[ -n "$PREFIX" ]]; then
    while IFS= read -r line; do
        [[ "$line" =~ ^#.*$ ]] && continue
        [[ -z "$line" ]] && continue

        KEY=$(echo "$line" | cut -d '=' -f1)
        VALUE=$(echo "$line" | cut -d '=' -f2-)

        # Coincide con el prefijo del entorno (ej. DEV_, QA_, etc.)
        if [[ "$KEY" == ${PREFIX}* ]]; then
            CLEAN_KEY="${KEY#${PREFIX}}"
            export "$CLEAN_KEY"="$VALUE"
            echo "export $CLEAN_KEY=\"$VALUE\"" >> export_vars.sh
        fi
    done < "$ENV_FILE"
fi

# ========================================================================
# 5. CONFIRMACIÓN
# ========================================================================
log_success "✨ Variables cargadas correctamente para '$DEPLOY_ENV'"
echo "export DEPLOY_ENV=\"$DEPLOY_ENV\"" >> export_vars.sh
echo "export PREFIX=\"$PREFIX\"" >> export_vars.sh
log_info "📄 Preview de export_vars.sh:"
head -n 20 export_vars.sh | sed 's/^/  [OK] /'