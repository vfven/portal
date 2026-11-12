# gfb-serviceportal-backend

API REST del Portal DevOps — Banco BASE. Expone los endpoints que consume el frontend para autoservicio, herramientas, solicitudes, despliegue e IA.

## Componentes

- **Node.js + Express** — API en `:3000`
- **Integraciones**: Jira (creación automática de tickets), Bitbucket (acceso a repos), Ollama (asistente IA)
- **SMTP** — envío de correos corporativos
- **Kubernetes** — manifests propios para despliegue independiente

## Estructura

```
.
├── src/
│   ├── app.js                       # bootstrap Express + registro de rutas
│   ├── config.js                    # variables del entorno
│   ├── routes/
│   │   ├── autoservicio.routes.js
│   │   ├── herramientas.routes.js
│   │   ├── solicitudes.routes.js
│   │   ├── despliegue.routes.js
│   │   └── chat.routes.js
│   ├── controllers/
│   │   ├── autoservicio.controller.js   # solicitud-simple, VM, namespace
│   │   ├── herramientas.controller.js   # Jenkins, Bitbucket, ArgoCD, K8s, etc.
│   │   ├── solicitudes.controller.js    # nueva herramienta, contenedor, infra
│   │   ├── despliegue.controller.js     # deploy K8s + Jenkins trigger + rollback
│   │   └── chat.controller.js           # proxy a Ollama con system prompt
│   └── helpers/
│       ├── jira.helpers.js              # crear tickets con labels + bloque JSON
│       ├── bitbucket.helpers.js
│       ├── mail.helpers.js              # SMTP
│       ├── solicitudes.helpers.js
│       └── despliegue.manifests.js
├── kubernetes/                          # manifests propios (pendiente de crear)
├── Dockerfile                           # Node 18-alpine, multi-stage, USER node
├── bitbucket-pipelines.yml              # build → ECR → manifests (pendiente)
└── .env                                 # configuración (no secretos)
```

## Endpoints

| Categoría | Endpoint | Descripción |
|-----------|----------|-------------|
| Health | `GET /health` | Liveness/readiness probe (Kubernetes) |
| Autoservicio | `POST /api/autoservicio/solicitud-simple` | Solicitud genérica con flujo Jira |
|  | `POST /api/autoservicio/solicitud-vm` | Aprovisionar VM en cloud |
|  | `POST /api/autoservicio/solicitud-namespace` | Crear namespace K8s |
| Herramientas | `POST /api/herramientas/jenkins/acceso` | Acceso a Jenkins |
|  | `POST /api/herramientas/bitbucket/acceso` | Acceso a Bitbucket |
|  | `POST /api/herramientas/argocd/app` | Onboarding de app en ArgoCD |
|  | `POST /api/herramientas/kubernetes/acceso` | RBAC en K8s |
|  | `POST /api/herramientas/sonarqube/proyecto` | Nuevo proyecto SonarQube |
|  | `POST /api/herramientas/grafana/dashboard` | Dashboard Grafana |
|  | `POST /api/herramientas/harbor/acceso` | Acceso a registry Harbor |
|  | `POST /api/herramientas/vault/secrets` | Solicitar path en Vault |
| Solicitudes | `POST /api/solicitudes/herramienta` | Nueva herramienta |
|  | `POST /api/solicitudes/contenedor` | Nuevo contenedor |
|  | `POST /api/solicitudes/infraestructura` | Nueva infra |
|  | `POST /api/solicitudes/automatizacion` | Automatización |
| Despliegue | `POST /api/despliegue/kubernetes` | Aplicar manifests |
|  | `POST /api/despliegue/jenkins-trigger` | Disparar job Jenkins |
|  | `POST /api/despliegue/rollback` | Rollback de deployment |
| IA | `POST /api/chat` | Asistente que consume Ollama |

Total: **18 endpoints** funcionales.

## Variables clave (`.env`)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `APP_PORT` | `3000` | Puerto del backend |
| `NODE_ENV` | `production` | Entorno |
| `JIRA_DOMAIN` | `https://bancobase.atlassian.net` | Tenant Jira |
| `JIRA_PROJECT_KEY` | `BSJ` | Proyecto destino de los tickets |
| `JIRA_API_TOKEN` | (Bitbucket var) | Token con permiso de creación |
| `JIRA_USER_EMAIL` | `digital@bancobase.com` | Usuario que crea los tickets |
| `SMTP_HOST` | `smtp.i.gslb` | Servidor SMTP corporativo |
| `SMTP_USER` / `SMTP_PASS` | (Vault) | Credenciales SMTP |
| `OLLAMA_URL` | `http://ollama:11434` | Servicio del repo `gfb-serviceportal-ai` |
| `OLLAMA_MODEL` | `qwen2.5:3b` | Modelo LLM |
| `CORREO_DESTINO` | `pruebasportal+digital@bancobase.com` | Mailbox de auditoría |

## Desarrollo local

```bash
npm install
npm run dev
```

Para integraciones completas necesitas Ollama corriendo (puedes levantarlo con el `docker-compose.yaml` del repo `portal` o apuntar `OLLAMA_URL` al cluster).

## Despliegue

El pipeline (cuando esté agregado) hará:

1. Inicializa submódulo `infra-cicd-tools`
2. Carga `.env` según el branch (`develop` → dev, `main` → prod)
3. Obtiene secretos desde HashiCorp Vault
4. Build de imagen Docker
5. Escaneos (Tenable + SonarQube)
6. Push a AWS ECR (repo `serviceportal-backend`)
7. Genera manifiestos K8s en `/tmp/kubernetes/manifests/<env>/`
8. Despliegue manual o automático según ambiente

## Pre-requisitos antes del primer push del pipeline

En **Bitbucket Repository Variables** (heredables desde Workspace):

- `VAULT_NAMESPACE`, `VAULT_ADDR`, `ROLE_ID`, `SECRET_ID`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `JIRA_USERNAME`, `JIRA_API_TOKEN`

En **AWS ECR**: crear el repositorio `serviceportal-backend`.

## Repos relacionados

| Repo | Rol |
|------|-----|
| `gfb-serviceportal-frontend` | UI estática (nginx + index.html) |
| `gfb-serviceportal-ai` | Wrapper Express + Ollama |
| `infra-cicd-tools` | Submódulo compartido con scripts de CI/CD |
