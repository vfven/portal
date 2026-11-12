# gfb-serviceportal-frontend

UI del Portal DevOps — Banco BASE. Aplicación estática servida por nginx que consume la API de `gfb-serviceportal-backend` y el asistente IA de `gfb-serviceportal-ai`.

## Stack

- **HTML/CSS/JS** (single-page, sin framework) — `index.html`
- **nginx** — sirve archivos estáticos + proxy reverso al backend
- **Docker** — imagen liviana basada en `nginx:alpine`
- **Kubernetes** — Deployment + Service + Ingress

## Estructura

```
.
├── index.html                 # SPA principal del portal
├── index.html_v1              # backup de la versión anterior
├── nginx.conf                 # config de nginx (proxy /api/ → backend)
├── Dockerfile                 # imagen estática (nginx + index.html)
├── kubernetes/
│   ├── base/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   ├── ingress.yaml
│   │   └── kustomization.yaml
│   └── overlays/
│       ├── dev/kustomization.yaml
│       └── prod/kustomization.yaml
├── infra-cicd-tools/          # submódulo compartido (scripts CI/CD)
├── bitbucket-pipelines.yml    # CI/CD: build → ECR → manifests → deploy
└── .env                       # variables del build/deploy (no secretos)
```

## Funcionalidades del portal

- **Autoservicio**: solicitudes simples, VMs cloud, namespaces K8s
- **Herramientas**: acceso Jenkins, Bitbucket, ArgoCD, Kubernetes, SonarQube, Grafana, Harbor, Vault
- **Solicitudes**: nuevas herramientas, contenedores, infraestructura, automatizaciones
- **Despliegue**: aplicar manifests, disparar jobs Jenkins, rollbacks
- **Asistente IA**: chat embebido con Ollama (favicon Banco BASE como avatar)

## Variables clave (`.env`)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `APP_PORT` | `80` | Puerto que expone nginx |
| `EKS_ECR_REPO_NAME` | `serviceportal-frontend` | Repo en AWS ECR |
| `DOMAIN` | (por ambiente) | Dominio público del ingress |
| `BACKEND_URL` | `http://serviceportal-backend` | Servicio K8s del backend |

## Desarrollo local

Levantar el stack completo (frontend + backend + Ollama) desde el repo padre `portal/`:

```bash
cd ../portal
docker compose up -d
# Frontend en http://localhost:8080
```

Para iterar sólo en el `index.html`, abrir el archivo directamente en el navegador con un servidor estático:

```bash
npx http-server . -p 8080
```

## Despliegue (Bitbucket Pipelines)

El pipeline ejecuta:

1. Inicializa submódulo `infra-cicd-tools`
2. Carga `.env` según el branch (`develop` → dev, `main` → prod)
3. Obtiene secretos desde HashiCorp Vault (AppRole)
4. Build de imagen Docker
5. Escaneos (Tenable + SonarQube)
6. Push a AWS ECR (repo `serviceportal-frontend`)
7. Genera manifiestos K8s con `kustomize` en `/tmp/kubernetes/manifests/<env>/`
8. Despliegue al cluster EKS (manual para prod)

### Pre-requisitos (una sola vez)

En **Bitbucket Repository / Workspace Variables**:

- `VAULT_NAMESPACE`, `VAULT_ADDR`, `ROLE_ID`, `SECRET_ID`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

En **AWS ECR**: repositorio `serviceportal-frontend` creado.

## Repos relacionados

| Repo | Rol |
|------|-----|
| `gfb-serviceportal-backend` | API REST (Node.js + Express) |
| `gfb-serviceportal-ai` | Wrapper IA + Ollama (K8s) |
| `infra-cicd-tools` | Submódulo con scripts compartidos |

## Convenciones

- `develop` → ambiente **dev** (deploy automático tras escaneo)
- `main` → ambiente **prod** (deploy manual)
- Cualquier cambio en `index.html` requiere refrescar caché (`Ctrl+F5`) para validar
