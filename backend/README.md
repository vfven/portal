# 📦 Estructura Modular del Backend — DevOps Portal Banco BASE

## 🏗️ Arquitectura de Directorios

```
backend/src/
├── app.js                          ← Punto de entrada (Express + rutas)
├── config.js                       ← Configuración (variables de entorno)
│
├── controllers/
│   ├── autoservicio.controller.js  ← Solicitudes simples + VM Cloud + K8s Namespace
│   ├── herramientas.controller.js  ← Acceso a 8 herramientas (Jenkins, Bitbucket, etc.)
│   ├── solicitudes.controller.js   ← Solicitudes generales (pendiente)
│   └── despliegue.controller.js    ← Despliegues K8s (pendiente)
│
├── helpers/
│   ├── mail.helpers.js             ← Envío de correos + plantillas HTML
│   ├── jira.helpers.js             ← Integración con Jira API
│   ├── validators.js               ← Validaciones por tipo (pendiente)
│   └── templates.js                ← Plantillas adicionales (pendiente)
│
└── routes/
    ├── autoservicio.routes.js      ← Rutas /api/autoservicio/*
    ├── herramientas.routes.js      ← Rutas /api/herramientas/*
    ├── solicitudes.routes.js       ← Rutas /api/solicitudes/* (pendiente)
    └── despliegue.routes.js        ← Rutas /api/despliegue/* (pendiente)
```

## 📡 Endpoints Disponibles

### 🔧 AUTOSERVICIO (`/api/autoservicio`)
```
POST /api/autoservicio/solicitud-simple     → Solicitudes genéricas
POST /api/autoservicio/solicitud-vm         → VMs en Cloud (AWS/Azure/GCP)
POST /api/autoservicio/solicitud-namespace  → Namespaces Kubernetes
```

### 🛠️ HERRAMIENTAS (`/api/herramientas`)
```
POST /api/herramientas/jenkins/acceso              → Acceso a Jenkins
POST /api/herramientas/bitbucket/acceso           → Acceso a Bitbucket
POST /api/herramientas/argocd/app                 → App en Argo CD
POST /api/herramientas/kubernetes/acceso          → Acceso RBAC K8s
POST /api/herramientas/sonarqube/proyecto         → Proyecto SonarQube
POST /api/herramientas/grafana/dashboard          → Dashboard Grafana
POST /api/herramientas/harbor/acceso              → Acceso a Harbor
POST /api/herramientas/vault/secrets              → Secretos en Vault
```

---

## 📋 Flujo de Solicitud (Ejemplo: Jenkins)

### Frontend → Backend → Jira + Email

```
1️⃣ Usuario completa formulario en el Frontend
   ├─ usuario: "jperez"
   ├─ rol: "admin"
   ├─ instancia: "Jenkins DEV"
   └─ justificacion: "Para administrar pipelines de microservicios"

2️⃣ Frontend envía POST a /api/herramientas/jenkins/acceso
   {
     "nombreServicio": "Jenkins",
     "usuario": "jperez",
     "rol": "admin",
     "instancia": "Jenkins DEV",
     "justificacion": "...",
     "email_solicitante": "jperez@bancobase.com"
   }

3️⃣ Backend (herramientas.controller.js)
   ├─ Valida datos ✓
   ├─ Genera ID solicitud: REQ-A1B2C3D4
   ├─ Envía correo a equipo DevOps (mail.helpers.js)
   ├─ Envía confirmación a solicitante
   └─ Crea ticket en Jira (jira.helpers.js)

4️⃣ Jira recibe ticket con ADF (tabla formateada)
   ├─ Proyecto: BSJ
   ├─ Tipo: Solicitud
   ├─ Resumen: "[ACCESO JENKINS] jperez - REQ-A1B2C3D4"
   ├─ Labels: [jenkins, acceso, admin]
   └─ Descripción con tabla de detalles

5️⃣ Equipo DevOps revisa en Jira y ejecuta
   ├─ Crear usuario en Jenkins
   ├─ Asignar permisos admin
   └─ Comentar en Jira cuando esté listo

6️⃣ Respuesta al Frontend
   {
     "success": true,
     "id": "REQ-A1B2C3D4",
     "jiraTicket": "BSJ-12345",
     "mensaje": "Solicitud de acceso Jenkins enviada..."
   }
```

---

## 🔑 Variables de Entorno (`.env`)

```bash
# Express
NODE_ENV=production
PORT=3000

# SMTP (para correos)
SMTP_HOST=smtp.i.gslb
SMTP_PORT=25
SMTP_USER=notificaciones@bancobase.com
SMTP_PASS=                           # dejar vacío si no se requiere auth

# Correo destino del equipo
CORREO_DESTINO=pruebasportal+digital@bancobase.com

# Jira (integración de tickets)
JIRA_DOMAIN=https://bancobase.atlassian.net
JIRA_PROJECT_KEY=BSJ
JIRA_USER_EMAIL=digital@bancobase.com
JIRA_API_TOKEN=tu_token_atlassian_aqui
JIRA_TYPE_SOLICITUD=10428            # ID del tipo de issue "Solicitud"
```

---

## 📧 Estructura de Correos

Todos los correos usan la plantilla **PLANTILLA_CORREO** en `mail.helpers.js`:

### Correo al Equipo DevOps
- **To:** `CORREO_DESTINO`
- **Subject:** `[Jenkins Acceso] jperez - REQ-A1B2C3D4`
- **Cuerpo:** Tabla con detalles de solicitud + sección especial (si aplica)

### Correo al Solicitante (Confirmación)
- **To:** `email_solicitante`
- **Subject:** `✅ Confirmación: Jenkins (REQ-A1B2C3D4)`
- **Cuerpo:** Resumen + estado "Recibida" + ETA 2 horas hábiles

---

## 🎨 Helpers

### `mail.helpers.js`
Funciones reutilizables para correos:
- `construirTablaHtml(datos, idSolicitud, excluir)` — genera tabla HTML con estilos inline
- `renderPlantilla({ titulo, saludo, intro, tablaHtml, seccionAdjuntos })` — rellena plantilla
- `enviarCorreoEquipo(datos, idSolicitud, { subject, seccionAdjuntos })` — envía a equipo
- `enviarCorreoSolicitante(datos, idSolicitud)` — envía confirmación

### `jira.helpers.js`
Funciones para Jira:
- `crearTicketJira(datos, idSolicitud, { tipoIssue, labels })` — crea ticket con ADF
- `agregarComentarioJira(ticketKey, comentario)` — agrega comentario a ticket

---

## ✅ Validaciones

Cada controller valida automáticamente:

### Jenkins
- ✓ Usuario corporativo
- ✓ Rol válido (admin/usuario/lectura)
- ✓ Email válido

### Bitbucket
- ✓ Usuario corporativo
- ✓ Repositorio en formato "equipo/repo"
- ✓ Al menos un permiso seleccionado

### Kubernetes
- ✓ Usuario corporativo
- ✓ Clúster válido
- ✓ Namespace requerido

*...etc. (cada herramienta tiene sus validaciones específicas)*

---

## 🚀 Pasos para Usar

### 1. Copiar archivos
```bash
# Helpers
cp mail.helpers.js backend/src/helpers/
cp jira.helpers.js backend/src/helpers/

# Controllers
cp autoservicio.controller.js backend/src/controllers/
cp herramientas.controller.js backend/src/controllers/

# Routes
cp autoservicio.routes.js backend/src/routes/
cp herramientas.routes.js backend/src/routes/

# App principal
cp app.js backend/src/
```

### 2. Instalar dependencias (si no están)
```bash
cd backend
npm install axios cors express nodemailer
```

### 3. Configurar `.env`
```bash
# backend/.env
SMTP_HOST=smtp.i.gslb
SMTP_PORT=25
SMTP_USER=notificaciones@bancobase.com
JIRA_API_TOKEN=tu_token_aqui
```

### 4. Ejecutar
```bash
docker compose up --build
# o sin Docker:
npm start
```

---

## 📤 Ejemplo de Solicitud cURL

### Solicitar acceso a Jenkins
```bash
curl -X POST http://localhost:9100/api/herramientas/jenkins/acceso \
  -H "Content-Type: application/json" \
  -d '{
    "nombreServicio": "Jenkins",
    "usuario": "jperez",
    "rol": "admin",
    "instancia": "Jenkins DEV",
    "justificacion": "Para administrar pipelines de microservicios",
    "email_solicitante": "jperez@bancobase.com",
    "fecha": "2026-06-18T15:30:00Z"
  }'
```

### Respuesta
```json
{
  "success": true,
  "id": "REQ-A1B2C3D4",
  "jiraTicket": "BSJ-12345",
  "mensaje": "Solicitud de acceso Jenkins enviada. ID: REQ-A1B2C3D4"
}
```

---

## 📌 Pendiente

- [ ] `solicitudes.controller.js` — Solicitudes generales (nuevas herramientas, contenedores, etc.)
- [ ] `despliegue.controller.js` — Despliegues en Kubernetes
- [ ] `solicitudes.routes.js` — Rutas para solicitudes generales
- [ ] `despliegue.routes.js` — Rutas para despliegues
- [ ] `validators.js` — Validaciones centralizadas
- [ ] Frontend: Formularios dinámicos para cada herramienta

---

**Versión:** 1.0.0  
**Última actualización:** Junio 2026  
**Banco BASE — DevOps Platform Engineering**
EOF
cat /mnt/user-data/outputs/ESTRUCTURA_BACKEND.md
Salida

# 📦 Estructura Modular del Backend — DevOps Portal Banco BASE

## 🏗️ Arquitectura de Directorios

```
backend/src/
├── app.js                          ← Punto de entrada (Express + rutas)
├── config.js                       ← Configuración (variables de entorno)
│
├── controllers/
│   ├── autoservicio.controller.js  ← Solicitudes simples + VM Cloud + K8s Namespace
│   ├── herramientas.controller.js  ← Acceso a 8 herramientas (Jenkins, Bitbucket, etc.)
│   ├── solicitudes.controller.js   ← Solicitudes generales (pendiente)
│   └── despliegue.controller.js    ← Despliegues K8s (pendiente)
│
├── helpers/
│   ├── mail.helpers.js             ← Envío de correos + plantillas HTML
│   ├── jira.helpers.js             ← Integración con Jira API
│   ├── validators.js               ← Validaciones por tipo (pendiente)
│   └── templates.js                ← Plantillas adicionales (pendiente)
│
└── routes/
    ├── autoservicio.routes.js      ← Rutas /api/autoservicio/*
    ├── herramientas.routes.js      ← Rutas /api/herramientas/*
    ├── solicitudes.routes.js       ← Rutas /api/solicitudes/* (pendiente)
    └── despliegue.routes.js        ← Rutas /api/despliegue/* (pendiente)
```

## 📡 Endpoints Disponibles

### 🔧 AUTOSERVICIO (`/api/autoservicio`)
```
POST /api/autoservicio/solicitud-simple     → Solicitudes genéricas
POST /api/autoservicio/solicitud-vm         → VMs en Cloud (AWS/Azure/GCP)
POST /api/autoservicio/solicitud-namespace  → Namespaces Kubernetes
```

### 🛠️ HERRAMIENTAS (`/api/herramientas`)
```
POST /api/herramientas/jenkins/acceso              → Acceso a Jenkins
POST /api/herramientas/bitbucket/acceso           → Acceso a Bitbucket
POST /api/herramientas/argocd/app                 → App en Argo CD
POST /api/herramientas/kubernetes/acceso          → Acceso RBAC K8s
POST /api/herramientas/sonarqube/proyecto         → Proyecto SonarQube
POST /api/herramientas/grafana/dashboard          → Dashboard Grafana
POST /api/herramientas/harbor/acceso              → Acceso a Harbor
POST /api/herramientas/vault/secrets              → Secretos en Vault
```

---

## 📋 Flujo de Solicitud (Ejemplo: Jenkins)

### Frontend → Backend → Jira + Email

```
1️⃣ Usuario completa formulario en el Frontend
   ├─ usuario: "jperez"
   ├─ rol: "admin"
   ├─ instancia: "Jenkins DEV"
   └─ justificacion: "Para administrar pipelines de microservicios"

2️⃣ Frontend envía POST a /api/herramientas/jenkins/acceso
   {
     "nombreServicio": "Jenkins",
     "usuario": "jperez",
     "rol": "admin",
     "instancia": "Jenkins DEV",
     "justificacion": "...",
     "email_solicitante": "jperez@bancobase.com"
   }

3️⃣ Backend (herramientas.controller.js)
   ├─ Valida datos ✓
   ├─ Genera ID solicitud: REQ-A1B2C3D4
   ├─ Envía correo a equipo DevOps (mail.helpers.js)
   ├─ Envía confirmación a solicitante
   └─ Crea ticket en Jira (jira.helpers.js)

4️⃣ Jira recibe ticket con ADF (tabla formateada)
   ├─ Proyecto: BSJ
   ├─ Tipo: Solicitud
   ├─ Resumen: "[ACCESO JENKINS] jperez - REQ-A1B2C3D4"
   ├─ Labels: [jenkins, acceso, admin]
   └─ Descripción con tabla de detalles

5️⃣ Equipo DevOps revisa en Jira y ejecuta
   ├─ Crear usuario en Jenkins
   ├─ Asignar permisos admin
   └─ Comentar en Jira cuando esté listo

6️⃣ Respuesta al Frontend
   {
     "success": true,
     "id": "REQ-A1B2C3D4",
     "jiraTicket": "BSJ-12345",
     "mensaje": "Solicitud de acceso Jenkins enviada..."
   }
```

---

## 🔑 Variables de Entorno (`.env`)

```bash
# Express
NODE_ENV=production
PORT=3000

# SMTP (para correos)
SMTP_HOST=smtp.i.gslb
SMTP_PORT=25
SMTP_USER=notificaciones@bancobase.com
SMTP_PASS=                           # dejar vacío si no se requiere auth

# Correo destino del equipo
CORREO_DESTINO=pruebasportal+digital@bancobase.com

# Jira (integración de tickets)
JIRA_DOMAIN=https://bancobase.atlassian.net
JIRA_PROJECT_KEY=BSJ
JIRA_USER_EMAIL=digital@bancobase.com
JIRA_API_TOKEN=tu_token_atlassian_aqui
JIRA_TYPE_SOLICITUD=10428            # ID del tipo de issue "Solicitud"
```

---

## 📧 Estructura de Correos

Todos los correos usan la plantilla **PLANTILLA_CORREO** en `mail.helpers.js`:

### Correo al Equipo DevOps
- **To:** `CORREO_DESTINO`
- **Subject:** `[Jenkins Acceso] jperez - REQ-A1B2C3D4`
- **Cuerpo:** Tabla con detalles de solicitud + sección especial (si aplica)

### Correo al Solicitante (Confirmación)
- **To:** `email_solicitante`
- **Subject:** `✅ Confirmación: Jenkins (REQ-A1B2C3D4)`
- **Cuerpo:** Resumen + estado "Recibida" + ETA 2 horas hábiles

---

## 🎨 Helpers

### `mail.helpers.js`
Funciones reutilizables para correos:
- `construirTablaHtml(datos, idSolicitud, excluir)` — genera tabla HTML con estilos inline
- `renderPlantilla({ titulo, saludo, intro, tablaHtml, seccionAdjuntos })` — rellena plantilla
- `enviarCorreoEquipo(datos, idSolicitud, { subject, seccionAdjuntos })` — envía a equipo
- `enviarCorreoSolicitante(datos, idSolicitud)` — envía confirmación

### `jira.helpers.js`
Funciones para Jira:
- `crearTicketJira(datos, idSolicitud, { tipoIssue, labels })` — crea ticket con ADF
- `agregarComentarioJira(ticketKey, comentario)` — agrega comentario a ticket

---

## ✅ Validaciones

Cada controller valida automáticamente:

### Jenkins
- ✓ Usuario corporativo
- ✓ Rol válido (admin/usuario/lectura)
- ✓ Email válido

### Bitbucket
- ✓ Usuario corporativo
- ✓ Repositorio en formato "equipo/repo"
- ✓ Al menos un permiso seleccionado

### Kubernetes
- ✓ Usuario corporativo
- ✓ Clúster válido
- ✓ Namespace requerido

*...etc. (cada herramienta tiene sus validaciones específicas)*

---

## 🚀 Pasos para Usar

### 1. Copiar archivos
```bash
# Helpers
cp mail.helpers.js backend/src/helpers/
cp jira.helpers.js backend/src/helpers/

# Controllers
cp autoservicio.controller.js backend/src/controllers/
cp herramientas.controller.js backend/src/controllers/

# Routes
cp autoservicio.routes.js backend/src/routes/
cp herramientas.routes.js backend/src/routes/

# App principal
cp app.js backend/src/
```

### 2. Instalar dependencias (si no están)
```bash
cd backend
npm install axios cors express nodemailer
```

### 3. Configurar `.env`
```bash
# backend/.env
SMTP_HOST=smtp.i.gslb
SMTP_PORT=25
SMTP_USER=notificaciones@bancobase.com
JIRA_API_TOKEN=tu_token_aqui
```

### 4. Ejecutar
```bash
docker compose up --build
# o sin Docker:
npm start
```

---

## 📤 Ejemplo de Solicitud cURL

### Solicitar acceso a Jenkins
```bash
curl -X POST http://localhost:9100/api/herramientas/jenkins/acceso \
  -H "Content-Type: application/json" \
  -d '{
    "nombreServicio": "Jenkins",
    "usuario": "jperez",
    "rol": "admin",
    "instancia": "Jenkins DEV",
    "justificacion": "Para administrar pipelines de microservicios",
    "email_solicitante": "jperez@bancobase.com",
    "fecha": "2026-06-18T15:30:00Z"
  }'
```

### Respuesta
```json
{
  "success": true,
  "id": "REQ-A1B2C3D4",
  "jiraTicket": "BSJ-12345",
  "mensaje": "Solicitud de acceso Jenkins enviada. ID: REQ-A1B2C3D4"
}
```

---

## 📌 Pendiente

- [ ] `solicitudes.controller.js` — Solicitudes generales (nuevas herramientas, contenedores, etc.)
- [ ] `despliegue.controller.js` — Despliegues en Kubernetes
- [ ] `solicitudes.routes.js` — Rutas para solicitudes generales
- [ ] `despliegue.routes.js` — Rutas para despliegues
- [ ] `validators.js` — Validaciones centralizadas
- [ ] Frontend: Formularios dinámicos para cada herramienta

---

**Versión:** 1.0.0  
**Última actualización:** Junio 2026  
**Banco BASE — DevOps Platform Engineering**


# 📋 PASO 2: SOLICITUDES GENERALES — DevOps Portal Backend

## 🎯 Estructura General

```
backend/src/
├── controllers/
│   └── solicitudes.controller.js     ✅ NUEVO (4 controllers)
├── routes/
│   └── solicitudes.routes.js         ✅ NUEVO (4 rutas)
└── app.js                            ✅ ACTUALIZADO (importa solicitudes)
```

---

## 📡 4 NUEVOS ENDPOINTS

### 1️⃣ Nueva Herramienta / Plataforma
```
POST /api/solicitudes/nueva-herramienta
```

**Para solicitar:**
- GitLab, DataDog, NewRelic, ELK Stack, etc.
- Herramientas nuevas que no están en catálogo

**Campos requeridos:**
```javascript
{
  "titulo": "Solicitud GitLab CI",
  "nombre_herramienta": "GitLab",
  "caso_uso": "Reemplazar Bitbucket para CI/CD",
  "beneficios": "Mejor integración con K8s, mejor performance",
  "presupuesto": "$5000/año",
  "descripcion": "Necesitamos GitLab para...",
  "email_solicitante": "jperez@bancobase.com"
}
```

---

### 2️⃣ Contenedor / Imagen Docker
```
POST /api/solicitudes/contenedor
```

**Para solicitar:**
- Imágenes Docker personalizadas
- Contenedores especializados con dependencias custom

**Campos requeridos:**
```javascript
{
  "titulo": "Contenedor Node.js Custom",
  "nombre_imagen": "my-app-node-dev",
  "tecnologia": "Node.js 18 + PostgreSQL 15",
  "base_image": "node:18-alpine",
  "dependencias": "pm2, redis-cli, curl, wget",
  "descripcion": "Imagen con todas las herramientas para dev...",
  "email_solicitante": "jperez@bancobase.com"
}
```

---

### 3️⃣ Infraestructura
```
POST /api/solicitudes/infraestructura
```

**Para solicitar:**
- Bases de datos (PostgreSQL, MongoDB, MySQL)
- Almacenamiento (S3, NFS, EBS)
- Load Balancers
- Cachés (Redis, Memcached)

**Campos requeridos:**
```javascript
{
  "titulo": "PostgreSQL para Pagos",
  "tipo_recurso": "Base de Datos PostgreSQL",
  "ambiente": "prod",
  "especificaciones": "16GB RAM, 500GB SSD, Multi-AZ",
  "sla_requerido": "99.99%",
  "backup": "Daily automated, 30 days retention",
  "descripcion": "BD para la aplicación de pagos...",
  "email_solicitante": "jperez@bancobase.com"
}
```

---

### 4️⃣ Automatización / Pipeline / Workflow
```
POST /api/solicitudes/automatizacion
```

**Para solicitar:**
- Workflows custom
- Pipelines especiales
- Scripts automatizados
- Integraciones complejas

**Campos requeridos:**
```javascript
{
  "titulo": "Workflow Backup Automático",
  "nombre_workflow": "Daily Database Backup to S3",
  "trigger": "Cron job (2 AM UTC)",
  "acciones": "Backup DB, compress, upload to S3, verify checksum, notify team",
  "frecuencia": "Diario",
  "descripcion": "Necesitamos automatizar backups de...",
  "email_solicitante": "jperez@bancobase.com"
}
```

---

## 📊 Validaciones Incluidas

### Nueva Herramienta ✓
- Título requerido
- Nombre de herramienta requerido
- Caso de uso requerido
- Descripción requerida
- Email válido

### Contenedor ✓
- Título requerido
- Nombre de imagen requerido
- Tecnología requerida
- Descripción requerida
- Email válido

### Infraestructura ✓
- Título requerido
- Tipo de recurso requerido
- Ambiente válido (dev/qa/stg/prod)
- Descripción requerida
- Email válido

### Automatización ✓
- Título requerido
- Nombre de workflow requerido
- Trigger/evento requerido
- Descripción requerida
- Email válido

---

## ✨ Características Automáticas

Cada endpoint incluye:

✅ **ID único** → `REQ-XXXXXXXX`

✅ **Correos automáticos:**
   - Al equipo (con detalles específicos por categoría)
   - Confirmación al solicitante

✅ **Tickets Jira** → `BSJ-XXXXX` con ADF

✅ **Validación de campos** → Retorna errores específicos (400)

✅ **Respuesta JSON:**
   ```json
   {
     "success": true,
     "id": "REQ-XXXXXXXX",
     "jiraTicket": "BSJ-12345",
     "mensaje": "Solicitud de nueva herramienta GitLab enviada..."
   }
   ```

---

## 📡 Ejemplos cURL

### Nueva Herramienta
```bash
curl -X POST http://localhost:9100/api/solicitudes/nueva-herramienta \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Solicitud GitLab CI",
    "nombre_herramienta": "GitLab",
    "caso_uso": "Reemplazar Bitbucket para CI/CD",
    "beneficios": "Mejor integración con K8s",
    "presupuesto": "$5000/año",
    "descripcion": "Necesitamos GitLab porque...",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

### Contenedor
```bash
curl -X POST http://localhost:9100/api/solicitudes/contenedor \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Contenedor Node.js Custom",
    "nombre_imagen": "my-app-node",
    "tecnologia": "Node.js 18 + PostgreSQL",
    "base_image": "node:18-alpine",
    "dependencias": "pm2, redis-cli, curl",
    "descripcion": "Imagen custom para dev...",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

### Infraestructura
```bash
curl -X POST http://localhost:9100/api/solicitudes/infraestructura \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "PostgreSQL para Pagos",
    "tipo_recurso": "Base de Datos PostgreSQL",
    "ambiente": "prod",
    "especificaciones": "16GB RAM, 500GB SSD, Multi-AZ",
    "sla_requerido": "99.99%",
    "backup": "Daily automated, 30 days",
    "descripcion": "BD para pagos...",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

### Automatización
```bash
curl -X POST http://localhost:9100/api/solicitudes/automatizacion \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Backup Automático",
    "nombre_workflow": "Daily DB Backup",
    "trigger": "Cron 2 AM UTC",
    "acciones": "Backup, compress, upload S3, verify, notify",
    "frecuencia": "Diario",
    "descripcion": "Necesitamos automatizar backups...",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

---

## 🚀 Pasos para Implementar PASO 2

### 1. Copiar nuevos archivos
```bash
cp solicitudes.controller.js backend/src/controllers/
cp solicitudes.routes.js backend/src/routes/
cp app_paso2.js backend/src/app.js  # reemplaza el app.js anterior
```

### 2. Verificar estructura
```bash
tree backend/src/ -L 2
```

Debe verse así:
```
backend/src/
├── app.js                          ✅ (actualizado)
├── config.js                       ✅ (sin cambios)
├── controllers/
│   ├── autoservicio.controller.js  ✅
│   ├── herramientas.controller.js  ✅
│   └── solicitudes.controller.js   ✅ NUEVO
├── helpers/
│   ├── jira.helpers.js             ✅
│   └── mail.helpers.js             ✅
└── routes/
    ├── autoservicio.routes.js      ✅
    ├── herramientas.routes.js      ✅
    └── solicitudes.routes.js       ✅ NUEVO
```

### 3. Reiniciar el backend
```bash
docker compose restart backend
# o si está corriendo local:
npm start
```

### 4. Probar nuevos endpoints
```bash
# Probar una solicitud de nueva herramienta
curl -X POST http://localhost:9100/api/solicitudes/nueva-herramienta \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Test",
    "nombre_herramienta": "Test Tool",
    "caso_uso": "Testing",
    "beneficios": "Good benefits",
    "presupuesto": "$1000",
    "descripcion": "Test description",
    "email_solicitante": "test@bancobase.com"
  }'
```

---

## 📊 Total de Endpoints (PASO 1 + PASO 2)

### PASO 1: Herramientas (11 endpoints)
- 3 Autoservicio
- 8 Herramientas

### PASO 2: Solicitudes Generales (4 endpoints) ✅ NUEVO
- 1 Nueva Herramienta
- 1 Contenedor
- 1 Infraestructura
- 1 Automatización

**TOTAL: 15 endpoints listos**

---

## 🔄 Flujo de Solicitud Típica (Nueva Herramienta)

```
Usuario rellena formulario "Solicitar GitLab"
              ↓
POST /api/solicitudes/nueva-herramienta
              ↓
solicitudes.controller.js valida ✓
              ↓
Genera REQ-A1B2C3D4
              ↓
Envía:
  - Correo a CORREO_DESTINO (con detalles)
  - Confirmación a solicitante
  - Ticket BSJ-12345 en Jira
              ↓
JSON response { success: true, id, jiraTicket }
              ↓
SPA muestra confirmación al usuario
              ↓
Equipo DevOps:
  - Recibe email
  - Abre Jira
  - Evalúa herramienta
  - Comenta avances en Jira
  - Usuario notificado automáticamente
```

---

## 📌 Validación de Campos

Si faltan campos → Error 400:
```json
{
  "success": false,
  "error": "Datos inválidos",
  "detalles": [
    "Título de la solicitud requerido",
    "Nombre de la herramienta requerido",
    "Email válido requerido"
  ]
}
```

---

## ✅ Checklist PASO 2

- [ ] Copié `solicitudes.controller.js`
- [ ] Copié `solicitudes.routes.js`
- [ ] Reemplacé `app.js` con `app_paso2.js`
- [ ] Reinicié backend
- [ ] Probé `/api/solicitudes/nueva-herramienta`
- [ ] Probé `/api/solicitudes/contenedor`
- [ ] Probé `/api/solicitudes/infraestructura`
- [ ] Probé `/api/solicitudes/automatizacion`
- [ ] Recibí emails en CORREO_DESTINO
- [ ] Se crearon tickets en Jira

---

## 📧 Próximo Paso

Cuando los 4 endpoints estén funcionando:

**"PASO 2 completado. Los 4 endpoints de solicitudes generales están funcionando. Listo para PASO 3: DESPLIEGUE ON-PREM"**

---

**Banco BASE — DevOps Platform Engineering**  
Junio 2026
EOF
cat /mnt/user-data/outputs/PASO2_SOLICITUDES_GENERALES.md
Salida

# 📋 PASO 2: SOLICITUDES GENERALES — DevOps Portal Backend

## 🎯 Estructura General

```
backend/src/
├── controllers/
│   └── solicitudes.controller.js     ✅ NUEVO (4 controllers)
├── routes/
│   └── solicitudes.routes.js         ✅ NUEVO (4 rutas)
└── app.js                            ✅ ACTUALIZADO (importa solicitudes)
```

---

## 📡 4 NUEVOS ENDPOINTS

### 1️⃣ Nueva Herramienta / Plataforma
```
POST /api/solicitudes/nueva-herramienta
```

**Para solicitar:**
- GitLab, DataDog, NewRelic, ELK Stack, etc.
- Herramientas nuevas que no están en catálogo

**Campos requeridos:**
```javascript
{
  "titulo": "Solicitud GitLab CI",
  "nombre_herramienta": "GitLab",
  "caso_uso": "Reemplazar Bitbucket para CI/CD",
  "beneficios": "Mejor integración con K8s, mejor performance",
  "presupuesto": "$5000/año",
  "descripcion": "Necesitamos GitLab para...",
  "email_solicitante": "jperez@bancobase.com"
}
```

---

### 2️⃣ Contenedor / Imagen Docker
```
POST /api/solicitudes/contenedor
```

**Para solicitar:**
- Imágenes Docker personalizadas
- Contenedores especializados con dependencias custom

**Campos requeridos:**
```javascript
{
  "titulo": "Contenedor Node.js Custom",
  "nombre_imagen": "my-app-node-dev",
  "tecnologia": "Node.js 18 + PostgreSQL 15",
  "base_image": "node:18-alpine",
  "dependencias": "pm2, redis-cli, curl, wget",
  "descripcion": "Imagen con todas las herramientas para dev...",
  "email_solicitante": "jperez@bancobase.com"
}
```

---

### 3️⃣ Infraestructura
```
POST /api/solicitudes/infraestructura
```

**Para solicitar:**
- Bases de datos (PostgreSQL, MongoDB, MySQL)
- Almacenamiento (S3, NFS, EBS)
- Load Balancers
- Cachés (Redis, Memcached)

**Campos requeridos:**
```javascript
{
  "titulo": "PostgreSQL para Pagos",
  "tipo_recurso": "Base de Datos PostgreSQL",
  "ambiente": "prod",
  "especificaciones": "16GB RAM, 500GB SSD, Multi-AZ",
  "sla_requerido": "99.99%",
  "backup": "Daily automated, 30 days retention",
  "descripcion": "BD para la aplicación de pagos...",
  "email_solicitante": "jperez@bancobase.com"
}
```

---

### 4️⃣ Automatización / Pipeline / Workflow
```
POST /api/solicitudes/automatizacion
```

**Para solicitar:**
- Workflows custom
- Pipelines especiales
- Scripts automatizados
- Integraciones complejas

**Campos requeridos:**
```javascript
{
  "titulo": "Workflow Backup Automático",
  "nombre_workflow": "Daily Database Backup to S3",
  "trigger": "Cron job (2 AM UTC)",
  "acciones": "Backup DB, compress, upload to S3, verify checksum, notify team",
  "frecuencia": "Diario",
  "descripcion": "Necesitamos automatizar backups de...",
  "email_solicitante": "jperez@bancobase.com"
}
```

---

## 📊 Validaciones Incluidas

### Nueva Herramienta ✓
- Título requerido
- Nombre de herramienta requerido
- Caso de uso requerido
- Descripción requerida
- Email válido

### Contenedor ✓
- Título requerido
- Nombre de imagen requerido
- Tecnología requerida
- Descripción requerida
- Email válido

### Infraestructura ✓
- Título requerido
- Tipo de recurso requerido
- Ambiente válido (dev/qa/stg/prod)
- Descripción requerida
- Email válido

### Automatización ✓
- Título requerido
- Nombre de workflow requerido
- Trigger/evento requerido
- Descripción requerida
- Email válido

---

## ✨ Características Automáticas

Cada endpoint incluye:

✅ **ID único** → `REQ-XXXXXXXX`

✅ **Correos automáticos:**
   - Al equipo (con detalles específicos por categoría)
   - Confirmación al solicitante

✅ **Tickets Jira** → `BSJ-XXXXX` con ADF

✅ **Validación de campos** → Retorna errores específicos (400)

✅ **Respuesta JSON:**
   ```json
   {
     "success": true,
     "id": "REQ-XXXXXXXX",
     "jiraTicket": "BSJ-12345",
     "mensaje": "Solicitud de nueva herramienta GitLab enviada..."
   }
   ```

---

## 📡 Ejemplos cURL

### Nueva Herramienta
```bash
curl -X POST http://localhost:9100/api/solicitudes/nueva-herramienta \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Solicitud GitLab CI",
    "nombre_herramienta": "GitLab",
    "caso_uso": "Reemplazar Bitbucket para CI/CD",
    "beneficios": "Mejor integración con K8s",
    "presupuesto": "$5000/año",
    "descripcion": "Necesitamos GitLab porque...",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

### Contenedor
```bash
curl -X POST http://localhost:9100/api/solicitudes/contenedor \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Contenedor Node.js Custom",
    "nombre_imagen": "my-app-node",
    "tecnologia": "Node.js 18 + PostgreSQL",
    "base_image": "node:18-alpine",
    "dependencias": "pm2, redis-cli, curl",
    "descripcion": "Imagen custom para dev...",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

### Infraestructura
```bash
curl -X POST http://localhost:9100/api/solicitudes/infraestructura \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "PostgreSQL para Pagos",
    "tipo_recurso": "Base de Datos PostgreSQL",
    "ambiente": "prod",
    "especificaciones": "16GB RAM, 500GB SSD, Multi-AZ",
    "sla_requerido": "99.99%",
    "backup": "Daily automated, 30 days",
    "descripcion": "BD para pagos...",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

### Automatización
```bash
curl -X POST http://localhost:9100/api/solicitudes/automatizacion \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Backup Automático",
    "nombre_workflow": "Daily DB Backup",
    "trigger": "Cron 2 AM UTC",
    "acciones": "Backup, compress, upload S3, verify, notify",
    "frecuencia": "Diario",
    "descripcion": "Necesitamos automatizar backups...",
    "email_solicitante": "jperez@bancobase.com"
  }'
```

---

## 🚀 Pasos para Implementar PASO 2

### 1. Copiar nuevos archivos
```bash
cp solicitudes.controller.js backend/src/controllers/
cp solicitudes.routes.js backend/src/routes/
cp app_paso2.js backend/src/app.js  # reemplaza el app.js anterior
```

### 2. Verificar estructura
```bash
tree backend/src/ -L 2
```

Debe verse así:
```
backend/src/
├── app.js                          ✅ (actualizado)
├── config.js                       ✅ (sin cambios)
├── controllers/
│   ├── autoservicio.controller.js  ✅
│   ├── herramientas.controller.js  ✅
│   └── solicitudes.controller.js   ✅ NUEVO
├── helpers/
│   ├── jira.helpers.js             ✅
│   └── mail.helpers.js             ✅
└── routes/
    ├── autoservicio.routes.js      ✅
    ├── herramientas.routes.js      ✅
    └── solicitudes.routes.js       ✅ NUEVO
```

### 3. Reiniciar el backend
```bash
docker compose restart backend
# o si está corriendo local:
npm start
```

### 4. Probar nuevos endpoints
```bash
# Probar una solicitud de nueva herramienta
curl -X POST http://localhost:9100/api/solicitudes/nueva-herramienta \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Test",
    "nombre_herramienta": "Test Tool",
    "caso_uso": "Testing",
    "beneficios": "Good benefits",
    "presupuesto": "$1000",
    "descripcion": "Test description",
    "email_solicitante": "test@bancobase.com"
  }'
```

---

## 📊 Total de Endpoints (PASO 1 + PASO 2)

### PASO 1: Herramientas (11 endpoints)
- 3 Autoservicio
- 8 Herramientas

### PASO 2: Solicitudes Generales (4 endpoints) ✅ NUEVO
- 1 Nueva Herramienta
- 1 Contenedor
- 1 Infraestructura
- 1 Automatización

**TOTAL: 15 endpoints listos**

---

## 🔄 Flujo de Solicitud Típica (Nueva Herramienta)

```
Usuario rellena formulario "Solicitar GitLab"
              ↓
POST /api/solicitudes/nueva-herramienta
              ↓
solicitudes.controller.js valida ✓
              ↓
Genera REQ-A1B2C3D4
              ↓
Envía:
  - Correo a CORREO_DESTINO (con detalles)
  - Confirmación a solicitante
  - Ticket BSJ-12345 en Jira
              ↓
JSON response { success: true, id, jiraTicket }
              ↓
SPA muestra confirmación al usuario
              ↓
Equipo DevOps:
  - Recibe email
  - Abre Jira
  - Evalúa herramienta
  - Comenta avances en Jira
  - Usuario notificado automáticamente
```

---

## 📌 Validación de Campos

Si faltan campos → Error 400:
```json
{
  "success": false,
  "error": "Datos inválidos",
  "detalles": [
    "Título de la solicitud requerido",
    "Nombre de la herramienta requerido",
    "Email válido requerido"
  ]
}
```

---

## ✅ Checklist PASO 2

- [ ] Copié `solicitudes.controller.js`
- [ ] Copié `solicitudes.routes.js`
- [ ] Reemplacé `app.js` con `app_paso2.js`
- [ ] Reinicié backend
- [ ] Probé `/api/solicitudes/nueva-herramienta`
- [ ] Probé `/api/solicitudes/contenedor`
- [ ] Probé `/api/solicitudes/infraestructura`
- [ ] Probé `/api/solicitudes/automatizacion`
- [ ] Recibí emails en CORREO_DESTINO
- [ ] Se crearon tickets en Jira

---

## 📧 Próximo Paso

Cuando los 4 endpoints estén funcionando:

**"PASO 2 completado. Los 4 endpoints de solicitudes generales están funcionando. Listo para PASO 3: DESPLIEGUE ON-PREM"**

---

**Banco BASE — DevOps Platform Engineering**  
Junio 2026
