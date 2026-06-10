#!/bin/bash

# =============================================================================
# Tenable Scan Image - Usando archivo .tar
# =============================================================================

set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"
source "$UTILS_DIR/security/hashicorp-vars.sh"

# Initialize
init_utilities
start_timer

log_section "Tenable Security Scan - Local TAR"
log_environment

# Set default values
APP_NAME="${APP_NAME:-${BITBUCKET_REPO_SLUG:-unknown-app}}"
IMAGE_TAG="${IMAGE_TAG:-${BITBUCKET_BUILD_NUMBER:-latest}}"
TAR_FILE="docker.tar"

log_step "1" "Validating configuration"
validate_not_empty "APP_NAME"
validate_not_empty "IMAGE_TAG"

hashicorp-vars_tenable

log_step "2" "Preparing image TAR file"

# Verificar que el archivo .tar existe
if [ ! -f "$TAR_FILE" ]; then
    log_info "Creating TAR file from local image..."
    log_command "docker save $APP_NAME:$IMAGE_TAG -o $TAR_FILE" "Error creating TAR from Docker image"
else
    log_info "Using existing TAR file: $TAR_FILE"
    # Verificar que el TAR sea válido
    log_command "tar -tf $TAR_FILE > /dev/null" "TAR file is corrupt or invalid"
fi

log_info "TAR file size: $(du -h $TAR_FILE | cut -f1)"

log_step "3" "Running Tenable Scan on TAR file"
log_info "Scanning: $TAR_FILE"

chmod 777 $TAR_FILE

# Escanear el archivo .tar directamente - SIN socket de Docker
log_command "docker run \
  --workdir /tmp/tenable \
  --volume $(pwd):/tmp/tenable \
  --pull=always tenable/cloud-security-scanner:latest \
  container-image scan \
  --archive-path $TAR_FILE \
  --api-token \"$TENABLE_API_TOKEN\" \
  --api-url $TENABLE_API_URL \
  --fail-on-min-severity critical" "Tenable scan failed"

log_duration "Tenable security scan"
log_success "Tenable scan completed successfully for: $TAR_FILE"

# Opcional: Limpiar el archivo TAR después del scan
# log_command "rm -f $TAR_FILE" "Error cleaning up TAR file"