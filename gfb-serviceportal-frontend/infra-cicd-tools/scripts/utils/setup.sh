#!/bin/bash

# =============================================================================
# Setup Script for Bitbucket Includes
# =============================================================================

set -euo pipefail

# Colores para logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Función para validar variables requeridas
check_required_vars() {
    local missing_vars=()
    
    for var in "$@"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required variables: ${missing_vars[*]}"
    fi
}

# Función para cargar variables de entorno
load_env_vars() {
    if [ -f .env ]; then
        log "Loading environment variables from .env"
        export $(grep -v '^#' .env | xargs)
    fi
}

# Setup inicial
setup_environment() {
    log "Setting up CI/CD environment..."
    
    # Instalar dependencias comunes
    apt-get update
    apt-get install -y \
        jq \
        curl \
        git \
        gettext-base \
        python3-pip 
    python3 --version
    #pip3 install awscli
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    
    # Configurar AWS CLI si las variables existen
    if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ]; then
        log "Configuring AWS CLI..."
        aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
        aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
        aws configure set region "${AWS_REGION:-us-east-1}"
    fi
    
    success "Environment setup completed"
}

# Si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    setup_environment
fi