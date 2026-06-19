# PASO 2: EJEMPLOS CURL 🧪
## Solicitudes Generales - DevOps Portal

---

## 📋 PRE-REQUISITOS

Asegurar que:
1. Backend está corriendo: `docker compose up`
2. Puerto 9100 está disponible
3. `.env` tiene configuración correcta

```bash
# Verificar salud del backend
curl http://localhost:9100/health
# Expected: {"status":"ok","timestamp":"2024-..."}
```

---

## 1️⃣ NUEVA HERRAMIENTA

### ✅ Ejemplo Exitoso

```bash
curl -X POST http://localhost:9100/api/solicitudes/herramienta \
  -H "Content-Type: application/json" \
  -d '{
    "nombreHerramienta": "GitLab",
    "descripcion": "Sistema de control de versiones descentralizado con CI/CD integrado",
    "razon": "Ampliar opciones de CI/CD y mejorar colaboración entre equipos en desarrollo",
    "enlaces": "https://gitlab.com, https://docs.gitlab.com/ee",
    "presupuesto": "$5000 USD anuales",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": "REQ-A1B2C3D4",
  "jiraTicket": "BSJ-12345",
  "mensaje": "Solicitud de herramienta registrada exitosamente"
}
```

---

## 2️⃣ CONTENEDOR/DOCKER

### ✅ Ejemplo Exitoso

```bash
curl -X POST http://localhost:9100/api/solicitudes/contenedor \
  -H "Content-Type: application/json" \
  -d '{
    "nombreContenedor": "app-analytics-v2",
    "baseImage": "node:18-alpine",
    "puertos": ["8080:8080/tcp", "9090:9090/tcp"],
    "volumenes": ["/data/logs", "/config/app"],
    "variables": ["NODE_ENV=production", "LOG_LEVEL=info", "ENABLE_METRICS=true"],
    "justificacion": "Nueva aplicación de análisis en tiempo real con 150 usuarios concurrentes",
    "email_solicitante": "agarcia@bancobase.com"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": "REQ-X9Y8Z7W6",
  "jiraTicket": "BSJ-12346",
  "mensaje": "Solicitud de contenedor registrada exitosamente"
}
```

---

## 3️⃣ INFRAESTRUCTURA

### ✅ Ejemplo 1: Base de Datos

```bash
curl -X POST http://localhost:9100/api/solicitudes/infraestructura \
  -H "Content-Type: application/json" \
  -d '{
    "tipoInfraestructura": "base-datos",
    "descripcion": "PostgreSQL para aplicación de reportes financieros",
    "especificaciones": "PostgreSQL 14, 4 vCPU, 16GB RAM, 500GB SSD, Multi-AZ, Automated Backups",
    "ambiente": "prod",
    "dependencias": "VPC-Principal, Subnet-Privada-A, Subnet-Privada-B, Security Group SG-DB-Main",
    "timeline": "2 semanas",
    "email_solicitante": "mlopez@bancobase.com"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": "REQ-M5N4O3P2",
  "jiraTicket": "BSJ-12348",
  "mensaje": "Solicitud de infraestructura registrada exitosamente"
}
```

---

## 4️⃣ AUTOMATIZACIÓN/PIPELINE

### ✅ Ejemplo 1: Jenkins Pipeline

```bash
curl -X POST http://localhost:9100/api/solicitudes/automatizacion \
  -H "Content-Type: application/json" \
  -d '{
    "nombrePipeline": "deploy-staging-nightly",
    "tipo": "jenkins-pipeline",
    "descripcion": "Despliegue automático a staging cada noche con tests de integración",
    "triggers": ["schedule", "webhook"],
    "etapas": ["checkout", "build", "unit-tests", "sonarqube-scan", "deploy", "smoke-tests"],
    "documentacion": "https://wiki.bancobase.com/jenkins/deploy-staging-nightly",
    "email_solicitante": "devops@bancobase.com"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": "REQ-F1G2H3I4",
  "jiraTicket": "BSJ-12351",
  "mensaje": "Solicitud de automatización registrada exitosamente"
}
```

---

## 📊 ENDPOINTS SUMMARY

```
POST /api/solicitudes/herramienta          → Nueva herramienta
POST /api/solicitudes/contenedor           → Nuevo contenedor
POST /api/solicitudes/infraestructura      → Nueva infraestructura
POST /api/solicitudes/automatizacion       → Nuevo pipeline
```

---

**¡PASO 2 LISTO PARA PROBAR! 🎉**
