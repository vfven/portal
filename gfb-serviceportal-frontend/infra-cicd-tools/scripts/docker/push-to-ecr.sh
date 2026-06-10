#!/bin/bash

# =============================================================================
# Push to ECR Script with Advanced Logging and Error Handling
# =============================================================================

set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"
source "$UTILS_DIR/jira/jira-comment-utils.sh"
source "$UTILS_DIR/security/hashicorp-vars.sh"

# Inicializar logging y manejo de errores
init_logging
init_error_handling
init_utilities
start_timer

# Parse command line arguments
parse_args "$@"

log_section "Validating values"
log_environment

log_step "1" "Validating configuration"

hashicorp-vars_aws

if [ -f docker-image-info.txt ]; then
    source docker-image-info.txt
else
    APP_NAME="${APP_NAME:-${BITBUCKET_REPO_SLUG}}"
    IMAGE_TAG="${IMAGE_TAG:-${APP_VERSION:-${BITBUCKET_BUILD_NUMBER:-1}}}"
    IMAGE_REPO="${IMAGE_REPO:-$APP_NAME}"
    log_warning "docker-image-info.txt not found, using default values"
fi

# Set defaults
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO_NAME="${ECR_REPO_NAME:-$APP_NAME}"
#ECR_REPO_NAME="dev-registry"

log_info "AWS Account: $AWS_ACCOUNT_ID"
log_info "AWS Region: $AWS_REGION"
log_info "ECR Repository: $ECR_REPO_NAME"
log_info "Image: $APP_NAME:$IMAGE_TAG"

aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "${AWS_REGION:-us-east-1}"

log_step "2" "Validating AWS configuration"

validate_aws_config

log_command "docker load -i docker.tar"

log_step "3" "Logging into ECR"
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"
log_command "aws ecr get-login-password --region \"$AWS_REGION\" | \
  docker login --username AWS --password-stdin \"$ECR_REGISTRY\""

#log_step "4" "Checking/Creating ECR repository"
#if ! aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
#    log_command "aws ecr describe-repositories --repository-names \"$ECR_REPO_NAME\" --region \"$AWS_REGION\""
#    log_info "Creating ECR repository: $ECR_REPO_NAME"
#    log_command "aws ecr create-repository --repository-name \"$ECR_REPO_NAME\" --region \"$AWS_REGION\""
#else
#    log_info "ECR repository already exists: $ECR_REPO_NAME"
#fi

log_step "4" "Tagging and pushing image"
FULL_IMAGE_NAME="$ECR_REGISTRY:$IMAGE_TAG"
#log_command "docker tag \"$APP_NAME:$IMAGE_TAG\" \"$FULL_IMAGE_NAME\""
#FULL_IMAGE_NAME="$ECR_REGISTRY/$ECR_REPO_NAME:$IMAGE_TAG"
log_command "docker tag \"$APP_NAME:$IMAGE_TAG\" \"$ECR_REGISTRY:$IMAGE_TAG\""
log_command "echo docker tag \"$APP_NAME:$IMAGE_TAG\" \"$ECR_REGISTRY:$IMAGE_TAG\""
log_command "docker push \"$ECR_REGISTRY:$IMAGE_TAG\""

log_step "5" "Saving push metadata"
safe_exec "echo \"ECR_IMAGE_URI=$FULL_IMAGE_NAME\" > ecr-push-info.txt"
safe_exec "echo \"ECR_REPO_NAME=$ECR_REPO_NAME\" >> ecr-push-info.txt"
safe_exec "echo \"IMAGE_TAG=$IMAGE_TAG\" >> ecr-push-info.txt"

log_duration "ECR push"
log_success "Image successfully pushed to ECR: $FULL_IMAGE_NAME"

# =============================================================================
# JIRA Integration
# =============================================================================
log_step "6" "JIRA Integration - Posting to Security Scan Subtask"

detect_subtask "Push to Container Registry"

# Incluir en el comentario
ECR_COMMENT="ECR Push - COMPLETED
Image: ${FULL_IMAGE_NAME}
Action: Successfully pushed to ECR
Date: $(date)
Status: ✅ COMPLETED"

SAFE_COMMENT=$(echo "$ECR_COMMENT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
create_jira_comments "$SAFE_COMMENT"
#create_jira_comments "$TENABLE_COMMENT"

post_jira_comments
