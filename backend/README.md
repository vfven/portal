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
