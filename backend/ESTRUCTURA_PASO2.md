# PASO 2: SOLICITUDES GENERALES 📋
## DevOps Portal Backend - Modular Architecture

---

## 📌 RESUMEN PASO 2

**Objetivo:** Agregar 4 controllers para solicitudes generales (herramientas, contenedores, infraestructura, automatización) con validadores específicos, email personalizado y Jira integration.

**Archivos Generados:**
- ✅ `solicitudes.helpers.js` → Validadores y constructores de detalles
- ✅ `solicitudes.controller.js` → 4 handlers con lógica específica
- ✅ `solicitudes.routes.js` → 4 endpoints POST
- ✅ `app.js` → Actualizado con rutas

**Total Endpoints:** 4 nuevos  
**Status:** Listo para copiar y probar

---

## 🏗️ ARQUITECTURA

```
backend/src/
├── app.js                          ✅ ACTUALIZADO (solicitudes routes)
├── config.js                       (existing)
├── helpers/
│   ├── mail.helpers.js             (existing - Step 1)
│   ├── jira.helpers.js             (existing - Step 1)
│   └── solicitudes.helpers.js      ✅ NEW (validadores)
├── controllers/
│   ├── autoservicio.controller.js  (existing - Step 1)
│   ├── herramientas.controller.js  (existing - Step 1)
│   └── solicitudes.controller.js   ✅ NEW (4 controllers)
└── routes/
    ├── autoservicio.routes.js      (existing - Step 1)
    ├── herramientas.routes.js      (existing - Step 1)
    └── solicitudes.routes.js       ✅ NEW (4 routes)
```

---

## 📊 CATEGORÍAS DE SOLICITUDES

### 1️⃣ NUEVA HERRAMIENTA/PLATAFORMA
**Endpoint:** `POST /api/solicitudes/herramienta`

**Uso:** Solicitar integración de nuevas herramientas (GitLab, Vault adicional, Grafana, etc.)

**Body Requerido:**
```json
{
  "nombreHerramienta": "GitLab",
  "descripcion": "Sistema de control de versiones descentralizado",
  "razon": "Ampliar opciones de CI/CD y mejorar colaboración entre equipos",
  "enlaces": "https://gitlab.com, https://docs.gitlab.com",
  "presupuesto": "$5000 USD",
  "email_solicitante": "jperez@bancobase.com"
}
```

**Campos Opcionales:**
- `enlaces` → URLs de referencia
- `presupuesto` → Estimado de costo

**Response:**
```json
{
  "success": true,
  "id": "REQ-A1B2C3D4",
  "jiraTicket": "BSJ-12345",
  "mensaje": "Solicitud de herramienta registrada exitosamente"
}
```

**Jira Labels:** `solicitud-herramienta`, `herramienta`, `nueva-plataforma`

---

### 2️⃣ CONTENEDOR/DOCKER
**Endpoint:** `POST /api/solicitudes/contenedor`

**Uso:** Solicitar nuevos contenedores personalizados para registros o desarrollo

**Body Requerido:**
```json
{
  "nombreContenedor": "app-analytics",
  "baseImage": "node:18-alpine",
  "puertos": ["8080:8080/tcp", "9090:9090/tcp"],
  "volumenes": ["/data/logs", "/config"],
  "variables": ["NODE_ENV=production", "LOG_LEVEL=info"],
  "justificacion": "Necesario para nueva aplicación de análisis en tiempo real",
  "email_solicitante": "agarcia@bancobase.com"
}
```

**Validaciones Especiales:**
- Puertos deben estar en formato `PUERTO_HOST:PUERTO_CONTENEDOR/(tcp|udp)`
- `baseImage` es obligatorio
- Arrays opcionales: `puertos`, `volumenes`, `variables`

**Response:**
```json
{
  "success": true,
  "id": "REQ-X9Y8Z7W6",
  "jiraTicket": "BSJ-12346",
  "mensaje": "Solicitud de contenedor registrada exitosamente"
}
```

**Jira Labels:** `solicitud-contenedor`, `docker`, `contenedor`, `registry`

---

### 3️⃣ INFRAESTRUCTURA
**Endpoint:** `POST /api/solicitudes/infraestructura`

**Uso:** Solicitar infraestructura: BD, almacenamiento, balanceadores, redes

**Body Requerido:**
```json
{
  "tipoInfraestructura": "base-datos",
  "descripcion": "PostgreSQL para aplicación de reportes financieros",
  "especificaciones": "PostgreSQL 14, 4 vCPU, 16GB RAM, 500GB SSD, Multi-AZ",
  "ambiente": "prod",
  "dependencias": "VPC-Principal, Subnet-Privada, Security Group SG-DB",
  "timeline": "2 semanas",
  "email_solicitante": "mlopez@bancobase.com"
}
```

**Tipos Válidos:**
- `base-datos` → PostgreSQL, MySQL, Aurora, etc. (Labels: `database`, `sql`)
- `almacenamiento` → S3, EFS, etc. (Labels: `storage`, `s3`)
- `load-balancer` → ALB, NLB, etc. (Labels: `networking`, `alb`)
- `networking` → VPC, subnets, etc. (Labels: `network`, `infrastructure`)

**Campos Opcionales:**
- `dependencias` → Recursos previos necesarios
- `timeline` → Tiempo estimado

**Response:**
```json
{
  "success": true,
  "id": "REQ-M5N4O3P2",
  "jiraTicket": "BSJ-12347",
  "mensaje": "Solicitud de infraestructura registrada exitosamente"
}
```

**Jira Labels (dinámicos):**
- `solicitud-infraestructura`
- + labels según tipo (database/sql, storage/s3, etc.)

---

### 4️⃣ AUTOMATIZACIÓN/PIPELINE
**Endpoint:** `POST /api/solicitudes/automatizacion`

**Uso:** Solicitar workflows, pipelines Jenkins, scripts de automatización, webhooks

**Body Requerido:**
```json
{
  "nombrePipeline": "deploy-staging-nightly",
  "tipo": "jenkins-pipeline",
  "descripcion": "Despliegue automático a staging cada noche con tests",
  "triggers": ["schedule", "webhook"],
  "etapas": ["build", "unit-tests", "deploy", "smoke-tests"],
  "documentacion": "https://wiki.bancobase.com/jenkins/deploy-staging",
  "email_solicitante": "devops@bancobase.com"
}
```

**Tipos Válidos:**
- `workflow-github` → GitHub Actions (Labels: `github`, `actions`)
- `jenkins-pipeline` → Jenkins Declarative/Scripted (Labels: `jenkins`, `groovy`)
- `automation-script` → Bash, Python, etc. (Labels: `automation`, `scripting`)
- `webhook` → Integraciones (Labels: `webhook`, `integration`)

**Campos Opcionales:**
- `triggers` → Array de triggers (schedule, webhook, manual)
- `etapas` → Array de etapas del pipeline
- `documentacion` → URL a wiki/docs

**Response:**
```json
{
  "success": true,
  "id": "REQ-F1G2H3I4",
  "jiraTicket": "BSJ-12348",
  "mensaje": "Solicitud de automatización registrada exitosamente"
}
```

**Jira Labels (dinámicos):**
- `solicitud-automatización`
- `pipeline`
- + labels según tipo (github/actions, jenkins/groovy, etc.)

---

## 📧 FLUJO DE EMAIL

Cada solicitud genera **2 emails automáticos:**

### Email al Equipo DevSecOps
- **Para:** `CORREO_DESTINO` (configurado en .env)
- **Asunto:** `[SOLICITUD] {Categoría} - {REQ-XXXXXX}`
- **Contenido:**
  - Tabla con detalles de la solicitud
  - Badge dorado con ID solicitud
  - Sección "Acción Requerida" con link a Jira
  - Inline styles para Outlook

### Email al Solicitante
- **Para:** `email_solicitante`
- **Asunto:** `✅ Solicitud Recibida - {REQ-XXXXXX}`
- **Contenido:**
  - Confirmación de recepción (badge verde)
  - Resumen de solicitud
  - Estimado: "Será procesada en las próximas 2 horas"
  - Ticket Jira para seguimiento

---

## 🔗 INTEGRACIÓN JIRA

Cada solicitud crea un **Issue en Jira** automáticamente:

| Campo | Valor |
|-------|-------|
| **Project** | BSJ (DevSecOps-SM) |
| **Issue Type** | 10428 (Solicitud) |
| **Labels** | `solicitud-{categoria}` + dinámicos |
| **Description** | Tabla ADF con detalles |
| **Summary** | `[SOLICITUD] {Categoría} - {REQ-XXXXXX}` |

**Labels Incluidos por Categoría:**

| Categoría | Labels |
|-----------|--------|
| Herramienta | `herramienta`, `nueva-plataforma` |
| Contenedor | `docker`, `contenedor`, `registry` |
| Infraestructura | Dinámicos: `database/sql`, `storage/s3`, etc. |
| Automatización | Dinámicos: `github/actions`, `jenkins/groovy`, etc. |

---

## ✅ VALIDACIONES

### Herramienta
```
✓ nombreHerramienta (requerido, trim)
✓ descripcion (requerido, trim)
✓ razon (requerido, trim)
✓ email_solicitante (requerido, válido)
```

### Contenedor
```
✓ nombreContenedor (requerido, trim)
✓ baseImage (requerido, trim)
✓ puertos (opcional, formato: PORT:PORT/(tcp|udp))
✓ justificacion (requerido, trim)
✓ email_solicitante (requerido, válido)
```

### Infraestructura
```
✓ tipoInfraestructura (requerido, enum: base-datos|almacenamiento|load-balancer|networking)
✓ descripcion (requerido, trim)
✓ especificaciones (requerido, trim)
✓ ambiente (requerido, trim)
✓ email_solicitante (requerido, válido)
```

### Automatización
```
✓ nombrePipeline (requerido, trim)
✓ tipo (requerido, enum: workflow-github|jenkins-pipeline|automation-script|webhook)
✓ descripcion (requerido, trim)
✓ email_solicitante (requerido, válido)
```

---

## 🔗 ENDPOINTS RESUMEN

```
POST /api/solicitudes/herramienta          → Nueva herramienta
POST /api/solicitudes/contenedor           → Nuevo contenedor
POST /api/solicitudes/infraestructura      → Nueva infraestructura
POST /api/solicitudes/automatizacion       → Nuevo pipeline/automation
```

---

## 🚀 IMPLEMENTACIÓN

### Paso 1: Copiar archivos
```bash
mkdir -p backend/src/helpers backend/src/controllers backend/src/routes

# Helpers
cp solicitudes.helpers.js backend/src/helpers/

# Controllers
cp solicitudes.controller.js backend/src/controllers/

# Routes
cp solicitudes.routes.js backend/src/routes/

# App (actualizado)
cp app.js backend/src/
```

### Paso 2: Verificar estructura
```bash
tree backend/src/ -I node_modules
```

### Paso 3: Rebuild y test
```bash
docker compose down
docker compose up --build
```

### Paso 4: Probar salud
```bash
curl http://localhost:9100/health
# Response: {"status":"ok","timestamp":"2024-..."}
```

---

## 📝 CHECKLIST IMPLEMENTACIÓN

- [ ] Copiar `solicitudes.helpers.js` a `backend/src/helpers/`
- [ ] Copiar `solicitudes.controller.js` a `backend/src/controllers/`
- [ ] Copiar `solicitudes.routes.js` a `backend/src/routes/`
- [ ] Copiar `app.js` a `backend/src/`
- [ ] Verificar `backend/src/helpers/mail.helpers.js` existe (Step 1)
- [ ] Verificar `backend/src/helpers/jira.helpers.js` existe (Step 1)
- [ ] Ejecutar `docker compose down && docker compose up --build`
- [ ] Esperar a que backend esté listo (logs: "Server running on port 3000")
- [ ] Probar `/health` endpoint
- [ ] Probar 1-2 endpoints de solicitudes con cURL
- [ ] Verificar emails recibidos
- [ ] Verificar tickets creados en Jira (BSJ-XXXXX)

---

## 🧪 EJEMPLOS CURL (COMPLETOS EN ARCHIVO SEPARADO)

Consulta `EJEMPLOS_CURL_PASO2.md` para:
- 4 ejemplos (uno por categoría)
- Validaciones de error
- Respuestas exitosas

---

## ⚠️ NOTAS IMPORTANTES

1. **Email Configuration:** Asegurar que `.env` tiene:
   ```
   SMTP_HOST=smtp.i.gslb
   SMTP_PORT=25
   SMTP_USER=notificaciones@bancobase.com
   CORREO_DESTINO=pruebasportal+digital@bancobase.com
   ```

2. **Jira Configuration:** Verificar:
   - `JIRA_API_TOKEN` es válido
   - Proyecto `BSJ` existe
   - Issue Type `10428` (Solicitud) existe

3. **Validaciones:** Errores retornan `400` con array `detalles`:
   ```json
   {
     "success": false,
     "error": "Datos inválidos",
     "detalles": ["nombreHerramienta es requerido", "email_solicitante debe ser un correo válido"]
   }
   ```

4. **ID Solicitud:** Generado con `crypto.randomBytes(4)` → `REQ-XXXXXXXX`
   - Único por solicitud
   - Usado en email y Jira

5. **Siguiente Paso (PASO 3):** Despliegue/Jenkins integration
   - `despliegue.controller.js` → Kubernetes deployments
   - `despliegue.routes.js` → WebHooks + Jenkins triggers

---

## 📞 SOPORTE

Si encuentras errores:
1. Verificar `.env` variables
2. Revisar logs de Docker: `docker logs backend`
3. Probar email manualmente: `docker exec backend node -e "require('./src/helpers/mail.helpers').isMailConfigured()"`
4. Probar Jira: `docker exec backend node -e "console.log(process.env.JIRA_DOMAIN)"`

---

**PASO 2 COMPLETADO ✅**
Listo para implementar y probar. Next: PASO 3 (Despliegue)
