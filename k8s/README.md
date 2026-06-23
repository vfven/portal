# Manifiestos Kubernetes — DevOps Portal

## Estructura

| Archivo                  | Recurso                                                  |
|--------------------------|----------------------------------------------------------|
| `00-namespace.yaml`      | Namespace `devops-portal`                                |
| `01-configmap.yaml`      | ConfigMap `backend-config` (vars NO sensibles)           |
| `02-secret.yaml`         | Secret `backend-secret` (credenciales — **REEMPLAZAR**)  |
| `03-ollama.yaml`         | PVC + Deployment + Service para Ollama                   |
| `04-backend.yaml`        | Deployment + Service del backend Node.js                 |
| `05-frontend.yaml`       | Deployment + Service del frontend nginx                  |
| `06-ingress.yaml`        | Ingress HTTP/HTTPS (opcional)                            |

## Pre-requisitos

1. Construir y subir las imágenes a tu registry:
   ```bash
   docker build -t bancobase/devops-portal-backend:latest  ./backend
   docker build -t bancobase/devops-portal-frontend:latest ./frontend
   docker push bancobase/devops-portal-backend:latest
   docker push bancobase/devops-portal-frontend:latest
   ```
   Ajusta el `image:` en `04-backend.yaml` y `05-frontend.yaml`.

2. Tener un `StorageClass` default disponible (para el PVC de Ollama).

3. Si vas a usar Ingress, instalar un Ingress Controller (`nginx-ingress` recomendado).

## Despliegue

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.yaml      # editar primero los valores
kubectl apply -f k8s/03-ollama.yaml
kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-frontend.yaml
kubectl apply -f k8s/06-ingress.yaml     # opcional

# o todo a la vez:
kubectl apply -f k8s/
```

## Verificación

```bash
kubectl -n devops-portal get pods,svc,ingress
kubectl -n devops-portal logs deploy/backend -f
kubectl -n devops-portal logs deploy/ollama -f
```

## Acceso sin Ingress (port-forward para pruebas)

```bash
kubectl -n devops-portal port-forward svc/frontend 9100:80
# abre http://localhost:9100
```

## Notas

- **Ollama**: corre con 1 réplica (PVC `ReadWriteOnce`). El `postStart` hace `ollama pull qwen2.5:3b` al arrancar; si ya está descargado en el volumen, es no-op.
- **Recursos**: ajusta `resources.requests/limits` según el nodo. Ollama necesita ≥2 GB de RAM solo para arrancar; ≥4 GB para inferir cómodo.
- **Secret en producción**: NO commitear `02-secret.yaml` con valores reales. Migra a Sealed Secrets, External Secrets Operator o Vault Injector.
- **HPA**: si quieres autoscaling para `backend` o `frontend`, añade un `HorizontalPodAutoscaler` (no incluido para no sobreconfigurar).
- **Modelo Llama**: cuando quieras cambiarlo, edita el ConfigMap (`OLLAMA_MODEL`) y el `postStart` del Deployment de Ollama (`ollama pull llama3.2:3b`).
