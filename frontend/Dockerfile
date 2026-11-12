# ═══════════════════════════════════════════════════
# DevOps Portal Backend — Banco BASE
# Imagen: node 18 alpine ejecutando la API
# ═══════════════════════════════════════════════════

#Stage 1: Construcción y dependencias ---
FROM node:20-alpine3.21 AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Instala solo dependencias de producción limpiando la caché
#RUN npm ci --only=production
RUN npm config set strict-ssl false
RUN npm install --omit=dev

#Stage 2: Entorno de ejecución final ---
FROM node:20-alpine3.21

# Parchar CVEs post-release de la imagen base (safety net)
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /root/.npm

WORKDIR /usr/src/app

# Copiar dependencias del stage anterior y el código fuente
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src

# Forzar entorno de producción
ENV NODE_ENV=production
ENV PORT=3000

# ── Versión inyectada en build time (consumida por GET /version) ──
# El pipeline pasa (ver infra-cicd-tools/scripts/build/build-image-buildkit.sh):
#   --build-arg APP_BUILD=$BITBUCKET_BUILD_NUMBER
#   --build-arg APP_BUILD_DATE=$(date -u +%Y-%m-%d)
# Defaults seguros para build local fuera del CI.
ARG APP_BUILD=local
ARG APP_BUILD_DATE=local
ENV APP_BUILD=${APP_BUILD}
ENV APP_BUILD_DATE=${APP_BUILD_DATE}

# Tratar el contenedor bajo el principio de menor privilegio (Non-Root User)
USER node

EXPOSE 3000

# Sincronización nativa de Healthcheck en K8s
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/app.js"]
