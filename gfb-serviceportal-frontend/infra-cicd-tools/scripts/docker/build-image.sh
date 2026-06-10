#!/bin/bash

# =============================================================================
# Build Docker Image Script with Advanced Logging and Error Handling
# =============================================================================

set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"
source "$UTILS_DIR/jira/jira-comment-utils.sh"
source "$UTILS_DIR/security/hashicorp-vars.sh"

# Initialize
init_utilities
start_timer

log_section "Docker Image Build Process"
log_environment

# Parse command line arguments
parse_args "$@"

# Set default values
APP_NAME="${APP_NAME:-${BITBUCKET_REPO_SLUG:-unknown-app}}"
IMAGE_TAG="${APP_VERSION:-${BITBUCKET_BUILD_NUMBER:-latest}}"
DOCKERFILE_PATH="${DOCKERFILE_PATH:-Dockerfile}"
DOCKER_CONTEXT="${DOCKER_CONTEXT:-.}"

log_step "1" "Validating configuration"
log_info "$APP_VERSION"
validate_not_empty "APP_NAME"
validate_not_empty "IMAGE_TAG"
validate_file_exists "$DOCKERFILE_PATH" "Dockerfile not found at: $DOCKERFILE_PATH"
validate_directory_exists "$DOCKER_CONTEXT" "Docker context directory not found: $DOCKER_CONTEXT"
validate_docker_config

log_step "2" "Building Docker image"
log_info "Application: $APP_NAME"
log_info "Image Tag: $IMAGE_TAG"
log_info "Dockerfile: $DOCKERFILE_PATH"
log_info "Build Context: $DOCKER_CONTEXT"

log_command "docker build \
  -t \"$APP_NAME:$IMAGE_TAG\" \
  -f \"$DOCKERFILE_PATH\" \
  \"$DOCKER_CONTEXT\""

log_step "3" "Saving build metadata"
safe_exec "echo \"APP_NAME=$APP_NAME\" > docker-image-info.txt"
safe_exec "echo \"IMAGE_TAG=$IMAGE_TAG\" >> docker-image-info.txt"
safe_exec "echo \"IMAGE_REPO=$APP_NAME\" >> docker-image-info.txt"

log_step "4" "Verifying built image"
log_command "docker images | grep \"$APP_NAME\""
log_command "docker save $APP_NAME:$IMAGE_TAG -o docker.tar"

log_duration "Docker build"
log_success "Docker image built successfully: $APP_NAME:$IMAGE_TAG"

# =============================================================================
# JIRA Integration
# =============================================================================
log_step "5" "JIRA Integration - Build Docker Image"

detect_subtask "Build Docker Image"

# Incluir en el comentario
DOCKER_COMMENT="Docker Image Build - COMPLETED
Image: ${APP_NAME}:${IMAGE_TAG}
Action: Doker image build successfully
Date: $(date)
Status: ✅ COMPLETED"

SAFE_COMMENT=$(echo "$DOCKER_COMMENT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
create_jira_comments "$SAFE_COMMENT"
#create_jira_comments "$TENABLE_COMMENT"

post_jira_comments