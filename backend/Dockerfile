# ═══════════════════════════════════════════════════
# DevOps Portal Frontend — Banco BASE
# Multi-stage: build con Vite + runtime nginx-alpine
# ═══════════════════════════════════════════════════

# ─── STAGE 1: build ────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias (cache amigable)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Build
# ARGs inyectados por el pipeline (ver build-image-buildkit.sh):
#   --build-arg APP_BUILD=$BITBUCKET_BUILD_NUMBER
#   --build-arg APP_BUILD_DATE=$(date -u +%Y-%m-%d)
# Defaults seguros para build local fuera del CI.
ARG APP_BUILD=local
ARG APP_BUILD_DATE=local
ENV APP_BUILD=${APP_BUILD}
ENV APP_BUILD_DATE=${APP_BUILD_DATE}

COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

# ─── STAGE 2: runtime (nginx) ──────────────────────
FROM nginx:1.27-alpine3.21

LABEL maintainer="DevOps Platform — Banco BASE"
LABEL description="Frontend SPA — DevOps Portal"
LABEL version="2.0.0"

RUN apk upgrade --no-cache

# Config de nginx (se procesa como template con envsubst — ver nginx.conf)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Defaults — docker-compose o `docker run` lo levantan como estaba antes.
# En k8s se sobreescriben por env del Deployment.
ENV BACKEND_HOST=backend \
    BACKEND_PORT=3000 \
    NGINX_ENVSUBST_FILTER="^BACKEND_"

# Artefacto del build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Permisos (nginx como non-root)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
