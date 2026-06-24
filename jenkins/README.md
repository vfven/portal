# Pipelines Jenkins · DevOps Portal

## Estructura de carpetas en Jenkins

```
/devsecops/portal/
├── hub-accesos                          ← dispatcher (este repo: jenkins/hub-accesos/Jenkinsfile)
└── accesos/
    ├── crear-usuario-jenkins            ← jenkins/accesos/crear-usuario-jenkins/Jenkinsfile
    ├── crear-usuario-bitbucket          (pendiente)
    └── crear-usuario-kubernetes         (pendiente)
```

## Cómo crear cada job en Jenkins UI

1. Crea las carpetas: `devsecops → portal → accesos`.
2. Crea un **Pipeline** llamado `hub-accesos` dentro de `/devsecops/portal/`:
   - **Pipeline script from SCM**
   - SCM: Git → URL de este repo
   - Script Path: `jenkins/hub-accesos/Jenkinsfile`
   - Marca **"This project is parameterized"** y declara los mismos parameters que el Jenkinsfile
     (también funciona sin declararlos antes: Jenkins los toma del Jenkinsfile en el primer run).
3. Repite para cada job hijo:
   - `crear-usuario-jenkins` → `jenkins/accesos/crear-usuario-jenkins/Jenkinsfile`
   - `crear-usuario-bitbucket` → (copia del anterior y adapta)
   - `crear-usuario-kubernetes` → (idem)

## Credenciales requeridas en Jenkins

| Credential ID                | Tipo                | Para qué                                 |
|------------------------------|---------------------|------------------------------------------|
| `jira-api-credentials`       | Username + password | Comentar tickets desde el hub            |
| `portal-webhook-secret-id`   | Secret text         | (Opcional) validar header X-Webhook-Secret |
| `jenkins-admin-target`       | Username + password | Crear usuarios en Jenkins target (cuando se implemente) |
| `kubeconfig-admin`           | Secret file         | Para job de kubernetes (cuando se implemente) |
| `bitbucket-admin`            | Username + password | Para job de bitbucket (cuando se implemente)  |

## URL del hub (configurar en Jira Automation)

```
POST https://<tu-jenkins>/job/devsecops/job/portal/job/hub-accesos/buildWithParameters
```

- Method: POST
- Auth Basic: usuario_servicio + API token de Jenkins
- Headers: `X-Webhook-Secret: <valor>` (opcional)
- Body: form-encoded con los parámetros declarados en el Jenkinsfile del hub

## Flujo end-to-end

```
Usuario → Portal → Backend → POST /rest/api/3/issue (crea BSJ-XX)
                                              ↓
                          Aprobador transiciona a "Approved"
                                              ↓
                Jira Automation → POST hub-accesos/buildWithParameters
                                              ↓
            Hub parsea PAYLOAD_JSON, decide subtipo, llama job hijo
                                              ↓
              Job hijo ejecuta provisión real (Jenkins/K8s/Bitbucket)
                                              ↓
                  Hub comenta resultado en el ticket Jira
```
