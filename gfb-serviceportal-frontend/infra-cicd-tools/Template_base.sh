#!/bin/bash

# Directorio base
BASE_DIR="kubernetes-manifests"

# Crear la estructura principal de directorios
echo "Creando la estructura de carpetas en $BASE_DIR..."
mkdir -p "$BASE_DIR"/{templates,overlays/{aws-eks,rancher-local},scripts}

# Crear archivos vacíos en la carpeta 'templates'
echo "Creando archivos en templates/..."
touch "$BASE_DIR"/templates/{kustomization.yaml.tpl,deployment.yaml.tpl,service.yaml.tpl,configmap.yaml.tpl,secret.yaml.tpl,hpa.yaml.tpl,ingress.yaml.tpl}

# Crear archivos vacíos en las carpetas 'overlays'
echo "Creando archivos en overlays/..."
touch "$BASE_DIR"/overlays/aws-eks/{kustomization.yaml,ingress.yaml.tpl}
touch "$BASE_DIR"/overlays/rancher-local/{kustomization.yaml,ingress.yaml.tpl}

# Crear archivos de script vacíos
echo "Creando archivos en scripts/..."
touch "$BASE_DIR"/scripts/{generate-manifests.sh,deploy-to-eks.sh,deploy-to-rancher.sh,deploy.sh,kustomize-setup.sh}

echo "¡Estructura de directorios y archivos creada exitosamente!"