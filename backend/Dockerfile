# ═══════════════════════════════════════════════════
# DevOps Portal Backend — Banco BASE
# Imagen: node 18 alpine ejecutando la API
# ═══════════════════════════════════════════════════

#Stage 1: Construcción y dependencias ---
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Instala solo dependencias de producción limpiando la caché
#RUN npm ci --only=production
RUN npm config set strict-ssl false
RUN npm install -omit=dev

#Stage 2: Entorno de ejecución final ---
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar dependencias del stage anterior y el código fuente
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src

# Forzar entorno de producción
ENV NODE_ENV=production
ENV PORT=3000

# Tratar el contenedor bajo el principio de menor privilegio (Non-Root User)
USER node

EXPOSE 3000

# Sincronización nativa de Healthcheck en K8s
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/app.js"]
