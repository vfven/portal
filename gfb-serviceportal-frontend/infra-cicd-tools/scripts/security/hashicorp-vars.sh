#!/bin/bash

# =============================================================================
# Hash Environment Variables and Authentication Functions
# =============================================================================

set -Eeuo pipefail

# Load utilities
UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"

# Initialize
init_utilities
start_timer

log_section "Environment Variables Processing"
log_environment

# Parse command line arguments
parse_args "$@"

log_step "1" "Validating configuration"
validate_not_empty "VAULT_NAMESPACE"
validate_not_empty "ROLE_ID"
validate_not_empty "SECRET_ID"
validate_not_empty "VAULT_ADDR"

hashicorp-vars_tenable() {
  log_step "1" "Processing Tenable environment variables"
  VAULT_TOKEN=$(curl -s \
            --header "X-Vault-Namespace: $VAULT_NAMESPACE" \
            --request POST \
            --data "{\"role_id\": \"$ROLE_ID\", \"secret_id\": \"$SECRET_ID\"}" \
            $VAULT_ADDR/v1/auth/approle/login | jq -r '.auth.client_token')
        
  RESPONSE=$(curl -s \
            --header "X-Vault-Token: $VAULT_TOKEN" \
            --header "X-Vault-Namespace: $VAULT_NAMESPACE" \
            $VAULT_ADDR/v1/kv/tenable/data/api-token)

  TENABLE_API_TOKEN=$(echo $RESPONSE | jq -r '.data.data.TENABLE_API_TOKEN')
  validate_required_vars TENABLE_API_TOKEN
  #validate_required_vars TENABLE_ACCESS_KEY TENABLE_SECRET_KEY

  log_success "Tenable environment variables processed"
}

# Function: aws
# Purpose: Validate and prepare AWS environment variables (with OIDC support)
hashicorp-vars_aws() {
  log_info "Processing AWS environment variables"
  VAULT_TOKEN=$(curl -s \
            --header "X-Vault-Namespace: $VAULT_NAMESPACE" \
            --request POST \
            --data "{\"role_id\": \"$ROLE_ID\", \"secret_id\": \"$SECRET_ID\"}" \
            $VAULT_ADDR/v1/auth/approle/login | jq -r '.auth.client_token')
        
  RESPONSE=$(curl -s \
            --header "X-Vault-Token: $VAULT_TOKEN" \
            --header "X-Vault-Namespace: $VAULT_NAMESPACE" \
            $VAULT_ADDR/v1/kv-aws/data/credenciales)

  AWS_ACCESS_KEY_ID=$(echo $RESPONSE | jq -r '.data.data.AWS_ACCESS_KEY_ID')
  AWS_SECRET_ACCESS_KEY=$(echo $RESPONSE | jq -r '.data.data.AWS_SECRET_ACCESS_KEY')
  AWS_ACCOUNT_ID=$(echo $RESPONSE | jq -r '.data.data.AWS_ACCOUNT_ID')
  AWS_REGION=$(echo $RESPONSE | jq -r '.data.data.AWS_REGION')

  log_success "AWS environment variables processed"
}

log_duration "Environment variables processing"

# Main execution (optional, for standalone runs)
#if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
#    log_info "Running hash-env-vars.sh as standalone script"
#    tenable
#    aws
#    log_duration "Environment variables processing"
#    log_success "Environment variables hashed and saved to hashed-env-vars.txt"
#fi

