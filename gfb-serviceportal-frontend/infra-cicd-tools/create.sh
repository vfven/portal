#!/bin/bash

# Este script crea una estructura de directorios para herramientas de CI/CD.

# Directorio base
base_dir="."

# Crear la estructura principal
mkdir -p "$base_dir"
touch "$base_dir/README.md"

# Crear el directorio de scripts y sus subdirectorios
mkdir -p "$base_dir/scripts/docker"
touch "$base_dir/scripts/docker/build-image.sh"
touch "$base_dir/scripts/docker/push-to-ecr.sh"

mkdir -p "$base_dir/scripts/kubernetes"
touch "$base_dir/scripts/kubernetes/generate-manifests.sh"
touch "$base_dir/scripts/kubernetes/deploy-to-eks.sh"
touch "$base_dir/scripts/kubernetes/deploy-to-rancher.sh"

mkdir -p "$base_dir/scripts/jira"
touch "$base_dir/scripts/jira/detect-jira-keys.sh"
touch "$base_dir/scripts/jira/comment-jira.sh"

mkdir -p "$base_dir/scripts/security"
touch "$base_dir/scripts/security/snyk-scan.sh"
touch "$base_dir/scripts/security/sonarqube-analysis.sh"

mkdir -p "$base_dir/scripts/jenkins"
touch "$base_dir/scripts/jenkins/trigger-jenkins-job.sh"

mkdir -p "$base_dir/scripts/monitoring"
touch "$base_dir/scripts/monitoring/datadog-metrics.sh"
touch "$base_dir/scripts/monitoring/prometheus-alerts.sh"

# Crear el directorio de plantillas
mkdir -p "$base_dir/templates/kubernetes"
touch "$base_dir/templates/kubernetes/deployment.yaml.tpl"
touch "$base_dir/templates/kubernetes/service.yaml.tpl"
touch "$base_dir/templates/kubernetes/configmap.yaml.tpl"
touch "$base_dir/templates/kubernetes/secret.yaml.tpl"
touch "$base_dir/templates/kubernetes/hpa.yaml.tpl"
touch "$base_dir/templates/kubernetes/ingress.yaml.tpl"

# Crear el directorio de configuraciones
mkdir -p "$base_dir/configs/jenkinsfiles"
touch "$base_dir/configs/jenkinsfiles/pipeline-generic.Jenkinsfile"

mkdir -p "$base_dir/configs/bitbucket-pipelines"
touch "$base_dir/configs/bitbucket-pipelines/cicd-tools-pipeline.yml"

mkdir -p "$base_dir/configs/github-actions"
touch "$base_dir/configs/github-actions/security-scan.yml"

# Crear el directorio de documentación
mkdir -p "$base_dir/docs"
touch "$base_dir/docs/setup-guide.md"
touch "$base_dir/docs/api-reference.md"
touch "$base_dir/docs/troubleshooting.md"

echo "¡Estructura de directorios creada exitosamente en '$base_dir'!"
