#!/bin/bash

# =============================================================================
# Tenable Scan Image
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

log_section "Validating values"
log_environment

# Parse command line arguments
parse_args "$@"

# Set default values
APP_NAME="${APP_NAME:-${BITBUCKET_REPO_SLUG:-unknown-app}}"
IMAGE_TAG="${IMAGE_TAG:-${BITBUCKET_BUILD_NUMBER:-latest}}"
DOCKERFILE_PATH="${DOCKERFILE_PATH:-Dockerfile}"
DOCKER_CONTEXT="${DOCKER_CONTEXT:-.}"

log_step "1" "Validating configuration"
validate_not_empty "APP_NAME"
validate_not_empty "IMAGE_TAG"
validate_file_exists "$DOCKERFILE_PATH" "Dockerfile not found at: $DOCKERFILE_PATH"
validate_directory_exists "$DOCKER_CONTEXT" "Docker context directory not found: $DOCKER_CONTEXT"
validate_docker_config

log_step "2" "Image properties"
log_info "Application: $APP_NAME"
log_info "Image Tag: $IMAGE_TAG"

hashicorp-vars_tenable

log_command "docker load -i docker.tar"
log_command "docker images"
#log_command "docker run $APP_NAME:$IMAGE_TAG"
#ulog_success "Image is working"

log_command "docker run \
  --workdir /tmp/tenable \
  --volume $BITBUCKET_CLONE_DIR:/tmp/tenable \
  --pull=always tenable/cloud-security-scanner:latest \
  container-image scan --name $APP_NAME:$IMAGE_TAG \
  --api-token $TENABLE_API_TOKEN \
  --api-url $TENABLE_API_URL \
  --fail-on-min-severity critical"

#--env-file .env \

log_duration "Docker build"
log_success "Tenable scan successfully: $APP_NAME:$IMAGE_TAG"