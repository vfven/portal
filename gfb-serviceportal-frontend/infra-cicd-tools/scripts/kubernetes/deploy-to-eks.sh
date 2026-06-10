#!/bin/bash

# =============================================================================
# Script para despliegue en EKS desde Bitbucket
# =============================================================================

set -euo pipefail

echo "=== DESPLEGANDO EN AWS EKS ==="

# Configurar AWS
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"

# Configurar EKS
aws eks update-kubeconfig --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION"

# Variables
APP_NAME="${1:-$APP_NAME}"
ENVIRONMENT="${2:-$DEPLOY_ENV}"
IMAGE_TAG="${3:-$IMAGE_TAG}"
MANIFESTS_DIR="./kubernetes-manifests/generated/${APP_NAME}-${ENVIRONMENT}"

# Validar
if [ ! -d "$MANIFESTS_DIR" ]; then
    echo "❌ No se encontraron manifiestos en: $MANIFESTS_DIR"
    echo "💡 Ejecuta primero el paso generate-manifests"
    exit 1
fi

# Desplegar
echo "🚀 Desplegando $APP_NAME ($IMAGE_TAG) en EKS ($ENVIRONMENT)..."
kubectl apply -f "$MANIFESTS_DIR/" --record

# Esperar rollout
echo "⏳ Esperando por el rollout..."
kubectl rollout status deployment/"$APP_NAME" -n "$ENVIRONMENT" --timeout=300s

# Verificar
echo "✅ Despliegue completado!"
kubectl get pods -n "$ENVIRONMENT" -l app="$APP_NAME"
kubectl get svc -n "$ENVIRONMENT" -l app="$APP_NAME"