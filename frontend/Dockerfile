# ═══════════════════════════════════════════════════
# DevOps Portal Frontend — Banco BASE
# Imagen: nginx alpine sirviendo la SPA
# ═══════════════════════════════════════════════════

FROM nginx:1.25-alpine

LABEL maintainer="DevOps Platform — Banco BASE"
LABEL description="Frontend SPA — DevOps Portal"
LABEL version="1.0.0"

# Quitar config default de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar la SPA
COPY index.html /usr/share/nginx/html/index.html

# Permisos correctos
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
