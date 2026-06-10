#!/bin/bash

# =============================================================================
# Sonarqube Scan Code
# =============================================================================

set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"
source "$UTILS_DIR/jira/jira-comment-utils.sh"
source "$UTILS_DIR/security/hashicorp-vars.sh" # <--- Este debe estar al final del source para validar porque cambia el path

# Initialize
init_logging
init_error_handling
init_utilities
start_timer

log_section "Sonarqube scan"
log_environment
set -e

#hashicorp-vars_sonar

log_step "1" "SonarCloud Scan"

SONAR_PROJECT_KEY="gfbancobase1"
SONAR_ORG="GfBancoBase"
SONAR_TOKEN=75ae4a35ba2fe07c33c98e0ac3aa3edc050e82ae


sonar-scanner \
  -Dsonar.projectKey=$SONAR_PROJECT_KEY \
  -Dsonar.organization=$SONAR_ORG \
  -Dsonar.sources=. \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=$SONAR_TOKEN

log_duration "Despliegue Rancher"


log_success "✅ Sonarqube scan results successfully posted to bitbucket"
log_duration "Sonarqube scan"
