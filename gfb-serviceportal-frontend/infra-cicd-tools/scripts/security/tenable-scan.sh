#!/bin/bash

# =============================================================================
# Tenable Scan Image
# =============================================================================

set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"
source "$UTILS_DIR/jira/jira-comment-utils.sh"
source "$UTILS_DIR/security/hashicorp-vars.sh" # <--- Este debe etar al final del source para validar porque cambia el path

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
  --output-file-formats json --output-path . \
 --fail-on-min-severity critical" "Tenable scan failed"

#"Tenable scan failed"
log_success "Tenable scan completed successfully for: $TAR_FILE"

cat results.json


# =============================================================================
# JIRA Integration
# =============================================================================
log_step "4" "JIRA Integration - Posting to Security Scan Subtask"

detect_subtask "Security Vulnerability Scan"

# Extraer información del resultado (results.json)
if [[ -f "results.json" ]]; then
    CRITICALS=$(jq -r '.VulnerabilitySeverities.Critical' results.json)
    HIGHS=$(jq -r '.VulnerabilitySeverities.High' results.json)
    MEDIUMS=$(jq -r '.VulnerabilitySeverities.Medium' results.json)
    LOWS=$(jq -r '.VulnerabilitySeverities.Low' results.json)
else
  CRITICALS=0
  HIGHS=0
  MEDIUMS=0
  LOWS=0
fi

# Determinar estado general
if (( CRITICALS > 0 )); then
  STATUS="❌ FAILED - Critical vulnerabilities detected"
elif (( HIGHS > 0 || MEDIUMS > 0 )); then
  STATUS="⚠️ WARNINGS - Medium or High vulnerabilities found"
else
  STATUS="✅ PASSED - No critical vulnerabilities"
fi

# Incluir en el comentario
TENABLE_COMMENT="Tenable Security Scan - COMPLETED
Application: ${APP_NAME}
Image Tag: ${IMAGE_TAG}
Scan Date: $(date)
Target: ${TAR_FILE} ($(du -h "$TAR_FILE" | cut -f1))
Status: ${STATUS}
Findings Summary:
  Critical: ${CRITICALS}
  High:     ${HIGHS}
  Medium:   ${MEDIUMS}
  Low:      ${LOWS}
The security scan has been completed successfully."

SAFE_COMMENT=$(echo "$TENABLE_COMMENT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
create_jira_comments "$SAFE_COMMENT"

post_jira_comments

log_duration "Tenable security scan with JIRA integration"
log_success "✅ Tenable scan results successfully posted to security scan subtask"