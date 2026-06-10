# Documentación: Pipelines de Bitbucket - JIRA + Docker Integration

## 📋 Descripción General

Este proyecto contiene múltiples pipelines de Bitbucket para:
1. **Integración con JIRA**: Comentarios automáticos en incidencias
2. **Docker + AWS ECR**: Construcción y despliegue de imágenes Docker

## 🏗️ Estructura de Archivos

```
tu-repositorio/
├── bitbucket-pipelines.yml           # Pipeline principal para JIRA
├── bitbucket-pipelines-docker.yml    # Pipeline para Docker y AWS ECR
├── scripts/
│   ├── jira/                         # Scripts para integración con JIRA
│   │   ├── check-jira-connection.sh
│   │   ├── detect-jira-keys.sh
│   │   └── comment-jira.sh
│   └── docker/                       # Scripts para Docker y AWS
│       ├── build-image.sh
│       └── push-to-ecr.sh
├── Dockerfile                        # Configuración de la imagen Docker
└── app/
    └── index.js                      # Aplicación Node.js de ejemplo
```

## 📁 Descripción de Archivos

### 1. bitbucket-pipelines.yml
**Propósito**: Integración automática con JIRA

**Funcionalidades**:
- Detección de claves JIRA en mensajes de commit
- Comentarios automáticos en incidencias
- Validación de conexión con JIRA

### 2. bitbucket-pipelines-docker.yml  
**Propósito**: Construcción y despliegue de imágenes Docker

**Funcionalidades**:
- Construcción de imágenes Docker
- Push automático a AWS ECR
- Gestión de tags y versiones

### 3. Scripts en /scripts/jira/
- `check-jira-connection.sh`: Valida conexión con JIRA
- `detect-jira-keys.sh`: Detecta claves JIRA en commits
- `comment-jira.sh`: Comenta en incidencias JIRA

### 4. Scripts en /scripts/docker/
- `build-image.sh`: Construye imagen Docker
- `push-to-ecr.sh`: Sube imagen a AWS ECR

## ⚙️ Configuración Requerida

### Variables de Entorno para JIRA:
1. **JIRA_BASE_URL**: URL de tu instancia JIRA
2. **JIRA_USERNAME**: Email de usuario JIRA
3. **JIRA_API_TOKEN**: Token de API de JIRA

### Variables de Entorno para AWS:
1. **AWS_ACCESS_KEY_ID**: Access Key de AWS
2. **AWS_SECRET_ACCESS_KEY**: Secret Access Key de AWS
3. **AWS_ACCOUNT_ID**: Account ID de AWS
4. **AWS_REGION** (opcional): Región de AWS (default: us-east-1)
5. **ECR_REPO_NAME** (opcional): Nombre del repositorio ECR

### Configurar en Bitbucket:
1. Ve a **Repository settings > Repository variables**
2. Agrega todas las variables requeridas
3. Marca como "Secured" para información sensible

## 🚀 Cómo Ejecutar los Pipelines

### Pipeline de JIRA (bitbucket-pipelines.yml)
```bash
# Ejecución automática en commits a main:
git commit -m "PROJ-123: Fix critical bug"
git push origin main

# Ejecución manual:
1. Ve a "Pipelines" 
2. Haz clic en "Run pipeline"
3. Selecciona "bitbucket-pipelines.yml"
4. Elige "jira-comment"
5. Configura variables y ejecuta
```

### Pipeline de Docker (bitbucket-pipelines-docker.yml)
```bash
# Ejecución automática en commits a main:
git commit -m "Update Docker configuration"
git push origin main

# Ejecución manual:
1. Ve a "Pipelines"
2. Haz clic en "Run pipeline" 
3. Selecciona "bitbucket-pipelines-docker.yml"
4. Elige "docker-build" o "docker-deploy"
5. Ejecuta
```

## 🎯 Pipelines Disponibles

### En bitbucket-pipelines.yml:
- **Automatic**: Ejecución en commits a main con claves JIRA
- **jira-comment**: Comentario manual en incidencia específica

### En bitbucket-pipelines-docker.yml:
- **Automatic**: Build + Push en commits a main
- **docker-build**: Solo construcción de imagen
- **docker-deploy**: Solo despliegue a ECR

## 🔧 Configuración de AWS IAM

### Política IAM Requerida:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:CreateRepository",
                "ecr:DescribeRepositories",
                "ecr:ListImages",
                "ecr:DescribeImages",
                "ecr:BatchGetImage",
                "ecr:BatchCheckLayerAvailability",
                "ecr:CompleteLayerUpload",
                "ecr:GetDownloadUrlForLayer",
                "ecr:InitiateLayerUpload",
                "ecr:PutImage",
                "ecr:UploadLayerPart"
            ],
            "Resource": "*"
        }
    ]
}
```

## 📊 Monitoreo y Verificación

### Para Pipeline de JIRA:
- ✅ Verificar logs en Bitbucket Pipelines
- ✅ Confirmar comentarios en la incidencia JIRA
- ✅ Revisar detección de claves en commits

### Para Pipeline de Docker:
- ✅ Verificar construcción exitosa en logs
- ✅ Confirmar push en AWS ECR Console
- ✅ Validar tags y versiones en repositorio ECR

## 🐛 Solución de Problemas Comunes

### Error 405 en JIRA:
- Verificar URL de JIRA
- Comprobar permisos de usuario API
- Validar token API

### Error de Docker daemon:
- Asegurar que el servicio Docker esté configurado
- Verificar memoria disponible

### Error de permisos AWS:
- Validar credenciales AWS
- Confirmar políticas IAM
- Verificar región configurada

### No detecta claves JIRA:
- Verificar formato de claves (MAYÚSCULAS-guion-números)
- Revisar mensaje de commit

## 🔄 Flujos de Trabajo Recomendados

### 1. Desarrollo con JIRA Integration:
```bash
git checkout -b feature/PROJ-123-new-feature
# Desarrollar funcionalidad
git commit -m "PROJ-123: Implement new feature"
git push origin feature/PROJ-123-new-feature
```

### 2. Deploy a Producción:
```bash
git checkout main
git merge feature/PROJ-123-new-feature
git commit -m "PROJ-123: Deploy to production"
git push origin main
# Se ejecutan ambos pipelines automáticamente
```

### 3. Deploy Manual:
```bash
# Solo construir imagen
1. Ejecutar pipeline "docker-build"

# Solo desplegar a ECR  
2. Ejecutar pipeline "docker-deploy"

# Notificar en JIRA
3. Ejecutar pipeline "jira-comment"
```

## 📝 Ejemplos de Uso

### Ejemplo 1: Desarrollo Normal
```bash
# Commit con clave JIRA
git commit -m "PROJ-456: Fix authentication issue"

# Push triggers:
# - Pipeline JIRA: Comenta en PROJ-456
# - Pipeline Docker: Build y push de imagen
```

### Ejemplo 2: Hotfix Urgente
```bash
git commit -m "PROJ-789: Critical security hotfix [skip ci]"
git push origin main

# Ejecutar manualmente:
# 1. docker-deploy (solo despliegue)
# 2. jira-comment (notificar en JIRA)
```

### Ejemplo 3: Múltiples Issues
```bash
git commit -m "PROJ-123 and PROJ-456: Update dependencies and fix UI issues"
# Resultado:
# - Comentarios en PROJ-123 y PROJ-456
# - Nueva imagen Docker en ECR
```

## 🛠️ Personalización

### Modificar Comportamiento JIRA:
Editar `scripts/jira/comment-jira.sh`:
```bash
# Personalizar mensaje de comentario
COMMENT="Deploy automatizado: $COMMIT_MESSAGE [Build: $BITBUCKET_BUILD_NUMBER]"
```

### Modificar Imagen Docker:
Editar `Dockerfile`:
```dockerfile
# Cambiar versión de Node.js
FROM node:20-alpine

# Agregar variables de entorno
ENV NODE_ENV=production
```

### Modificar Repositorio ECR:
Editar `scripts/docker/push-to-ecr.sh`:
```bash
# Cambiar nombre del repositorio
ECR_REPO_NAME="mi-repositorio-personalizado"
```

## 🔒 Mejores Prácticas de Seguridad

- ✅ Usar variables "Secured" en Bitbucket
- ✅ Rotar tokens API regularmente
- ✅ Limitar permisos IAM al mínimo necesario
- ✅ Usar ECR scanning para vulnerabilidades
- ✅ Monitorizar logs de ejecución

## 📈 Optimización de Performance

### Para Pipeline de Docker:
- Usar build caching
- Implementar multi-stage builds
- Optimizar layers de Dockerfile

### Para Pipeline de JIRA:
- Ejecución paralela para múltiples issues
- Cache de conexiones JIRA
- Validación temprana de claves

## 🤝 Soporte y Recursos

### Documentación Oficial:
- [Bitbucket Pipelines](https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/)
- [JIRA REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)

### Soporte Técnico:
1. Revisar logs de ejecución en Bitbucket
2. Verificar configuración de variables
3. Probar con pipelines de diagnóstico
4. Consultar documentación de APIs

## 🚨 Troubleshooting Avanzado

### Diagnosticar Problemas de Conexión:
```bash
# Ejecutar pipeline de diagnóstico
1. Run pipeline > diagnose-jira
2. Run pipeline > test-aws-connection
```

### Verificar Configuración AWS:
```bash
# Probar conexión AWS manualmente
aws sts get-caller-identity
aws ecr describe-repositories
```

### Verificar Configuración JIRA:
```bash
# Probar API JIRA manualmente
curl -u user:token $JIRA_BASE_URL/rest/api/2/myself
```

---

**Estado**: ✅ Production Ready  
**Última Actualización**: ${current_date}  
**Versión**: 2.0 (Multi-pipeline)  
**Maintainer**: ${your_name}

## 🔄 Changelog

### v2.0 (Current)
- ✅ Soporte para múltiples archivos de pipeline
- ✅ Separación de concerns (JIRA vs Docker)
- ✅ Mejor organización de scripts
- ✅ Documentación completa

### v1.0 
- ✅ Integración básica con JIRA
- ✅ Pipeline simple de Docker
- ✅ Funcionalidad core implementada

¿Necesitas ayuda adicional con la configuración o tienes algún problema específico?