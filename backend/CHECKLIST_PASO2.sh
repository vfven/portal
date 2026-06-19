#!/bin/bash
# PASO 2 IMPLEMENTATION CHECKLIST
# DevOps Portal Backend - Solicitudes Generales
# ==================================================

echo "🚀 PASO 2: SOLICITUDES GENERALES - CHECKLIST IMPLEMENTACIÓN"
echo "=========================================================="
echo ""

# COLORES
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# FUNCIONES HELPER
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 existe"
    return 0
  else
    echo -e "${RED}✗${NC} $1 NO existe"
    return 1
  fi
}

print_section() {
  echo ""
  echo -e "${BLUE}### $1${NC}"
  echo "---"
}

# PASO 0: VERIFICAR ARCHIVOS PASO 1
print_section "PASO 0: Verificar archivos PASO 1 (prerequisito)"

echo "Estos archivos deben existir de PASO 1:"
check_file "backend/src/helpers/mail.helpers.js"
check_file "backend/src/helpers/jira.helpers.js"
check_file "backend/src/controllers/autoservicio.controller.js"
check_file "backend/src/controllers/herramientas.controller.js"
check_file "backend/src/routes/autoservicio.routes.js"
check_file "backend/src/routes/herramientas.routes.js"

# PASO 1: COPIAR ARCHIVOS PASO 2
print_section "PASO 1: Copiar archivos PASO 2"

echo "Copiar archivos a backend/src/:"
echo ""

# Crear directorios si no existen
mkdir -p backend/src/helpers
mkdir -p backend/src/controllers
mkdir -p backend/src/routes

# Copiar helpers
if cp solicitudes.helpers.js backend/src/helpers/ 2>/dev/null; then
  check_file "backend/src/helpers/solicitudes.helpers.js"
else
  echo -e "${YELLOW}⚠${NC}  Descargar solicitudes.helpers.js desde /mnt/user-data/outputs/"
fi

# Copiar controller
if cp solicitudes.controller.js backend/src/controllers/ 2>/dev/null; then
  check_file "backend/src/controllers/solicitudes.controller.js"
else
  echo -e "${YELLOW}⚠${NC}  Descargar solicitudes.controller.js desde /mnt/user-data/outputs/"
fi

# Copiar routes
if cp solicitudes.routes.js backend/src/routes/ 2>/dev/null; then
  check_file "backend/src/routes/solicitudes.routes.js"
else
  echo -e "${YELLOW}⚠${NC}  Descargar solicitudes.routes.js desde /mnt/user-data/outputs/"
fi

# Copiar app.js
if cp app.js backend/src/ 2>/dev/null; then
  check_file "backend/src/app.js"
else
  echo -e "${YELLOW}⚠${NC}  Descargar app.js desde /mnt/user-data/outputs/"
fi

# PASO 2: VERIFICAR ESTRUCTURA
print_section "PASO 2: Verificar estructura backend"

echo "Estructura esperada:"
echo ""
echo "backend/src/"
echo "├── app.js ✓"
echo "├── config.js ✓"
echo "├── helpers/"
echo "│   ├── mail.helpers.js ✓"
echo "│   ├── jira.helpers.js ✓"
echo "│   └── solicitudes.helpers.js ✓ NEW"
echo "├── controllers/"
echo "│   ├── autoservicio.controller.js ✓"
echo "│   ├── herramientas.controller.js ✓"
echo "│   └── solicitudes.controller.js ✓ NEW"
echo "└── routes/"
echo "    ├── autoservicio.routes.js ✓"
echo "    ├── herramientas.routes.js ✓"
echo "    └── solicitudes.routes.js ✓ NEW"
echo ""

# Listar archivos reales
if [ -d "backend/src" ]; then
  echo "Archivos actuales en backend/src/:"
  find backend/src -type f -name "*.js" | sort | sed 's/^/  /'
fi

# PASO 3: VALIDAR .env
print_section "PASO 3: Validar configuración .env"

echo "Variables requeridas en .env:"
echo ""

ENV_VARS=(
  "NODE_ENV=production"
  "PORT=3000"
  "SMTP_HOST=smtp.i.gslb"
  "SMTP_PORT=25"
  "SMTP_USER=notificaciones@bancobase.com"
  "CORREO_DESTINO=pruebasportal+digital@bancobase.com"
  "JIRA_DOMAIN=https://bancobase.atlassian.net"
  "JIRA_PROJECT_KEY=BSJ"
  "JIRA_USER_EMAIL=digital@bancobase.com"
  "JIRA_API_TOKEN=tu_api_token"
  "JIRA_TYPE_SOLICITUD=10428"
)

if [ -f ".env" ]; then
  for var in "${ENV_VARS[@]}"; do
    VAR_NAME=$(echo "$var" | cut -d= -f1)
    VAR_VALUE=$(grep "^$VAR_NAME=" .env 2>/dev/null | cut -d= -f2-)
    if [ -n "$VAR_VALUE" ]; then
      echo -e "${GREEN}✓${NC} $VAR_NAME = ${VAR_VALUE}"
    else
      echo -e "${RED}✗${NC} $VAR_NAME = (no encontrado)"
    fi
  done
else
  echo -e "${RED}✗${NC} .env no existe en raíz del proyecto"
fi

# PASO 4: REBUILD DOCKER
print_section "PASO 4: Rebuild Docker"

echo "Comandos para rebuild:"
echo ""
echo "  docker compose down"
echo "  docker compose up --build"
echo ""
echo -e "${YELLOW}Ejecutar ahora? (si/no)${NC}"
read -r rebuild_confirm

if [ "$rebuild_confirm" == "si" ] || [ "$rebuild_confirm" == "yes" ] || [ "$rebuild_confirm" == "y" ]; then
  echo "Deteniendo servicios..."
  docker compose down
  
  echo "Rebuilding..."
  docker compose up --build
else
  echo -e "${YELLOW}⚠${NC}  Recordar ejecutar: docker compose down && docker compose up --build"
fi

# PASO 5: ESPERAR A QUE BACKEND ESTÉ LISTO
print_section "PASO 5: Esperar a backend listo"

echo "Esperando que backend esté listo (máx 30 segundos)..."
echo ""

for i in {1..30}; do
  if curl -s http://localhost:9100/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend está listo!"
    break
  else
    echo -n "."
    sleep 1
  fi
done

# PASO 6: TEST HEALTH ENDPOINT
print_section "PASO 6: Test /health endpoint"

echo "Ejecutando: curl http://localhost:9100/health"
echo ""

HEALTH_RESPONSE=$(curl -s http://localhost:9100/health)
if [ -n "$HEALTH_RESPONSE" ]; then
  echo -e "${GREEN}✓${NC} Response: $HEALTH_RESPONSE"
else
  echo -e "${RED}✗${NC} No response from /health"
fi

# PASO 7: TEST UN ENDPOINT SOLICITUD
print_section "PASO 7: Test endpoint solicitud (herramienta)"

echo "Ejecutando cURL de prueba..."
echo ""
echo "curl -X POST http://localhost:9100/api/solicitudes/herramienta \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{...}'"
echo ""

TEST_RESPONSE=$(curl -s -X POST http://localhost:9100/api/solicitudes/herramienta \
  -H "Content-Type: application/json" \
  -d '{
    "nombreHerramienta": "Test Herramienta",
    "descripcion": "Test Description",
    "razon": "Test Reason",
    "email_solicitante": "test@bancobase.com"
  }')

if echo "$TEST_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓${NC} Response exitosa!"
  echo "Response: $TEST_RESPONSE"
else
  echo -e "${RED}✗${NC} Response no válida"
  echo "Response: $TEST_RESPONSE"
fi

# PASO 8: VERIFICAR EMAILS
print_section "PASO 8: Verificar emails"

echo "Emails enviados a:"
echo "  1. CORREO_DESTINO (pruebasportal+digital@bancobase.com)"
echo "  2. email_solicitante (test@bancobase.com)"
echo ""
echo -e "${YELLOW}⚠${NC}  Revisar inbox en 5-10 segundos"

# PASO 9: VERIFICAR JIRA
print_section "PASO 9: Verificar ticket en Jira"

echo "Verificar en: https://bancobase.atlassian.net/issues"
echo "Buscar por label: solicitud-herramienta"
echo ""
echo -e "${YELLOW}⚠${NC}  Si la solicitud fue exitosa, debería haber un ticket nuevo"

# PASO 10: VALIDAR TODOS LOS ENDPOINTS
print_section "PASO 10: Validar todos los endpoints"

echo "Endpoints disponibles:"
echo ""
echo "  1. POST /api/solicitudes/herramienta        ✓"
echo "  2. POST /api/solicitudes/contenedor         ✓"
echo "  3. POST /api/solicitudes/infraestructura    ✓"
echo "  4. POST /api/solicitudes/automatizacion     ✓"
echo ""

# Test cada endpoint
test_endpoint() {
  local endpoint=$1
  local data=$2
  local name=$3
  
  RESPONSE=$(curl -s -X POST "http://localhost:9100/api/solicitudes/$endpoint" \
    -H "Content-Type: application/json" \
    -d "$data")
  
  if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓${NC} $name: OK"
  else
    echo -e "${RED}✗${NC} $name: FAILED"
  fi
}

test_endpoint "herramienta" '{"nombreHerramienta":"T1","descripcion":"D","razon":"R","email_solicitante":"t@b.com"}' "Herramienta"
test_endpoint "contenedor" '{"nombreContenedor":"C1","baseImage":"ubuntu","justificacion":"J","email_solicitante":"t@b.com"}' "Contenedor"
test_endpoint "infraestructura" '{"tipoInfraestructura":"base-datos","descripcion":"D","especificaciones":"E","ambiente":"dev","email_solicitante":"t@b.com"}' "Infraestructura"
test_endpoint "automatizacion" '{"nombrePipeline":"P1","tipo":"jenkins-pipeline","descripcion":"D","email_solicitante":"t@b.com"}' "Automatización"

# PASO 11: REVISAR LOGS
print_section "PASO 11: Revisar logs de backend"

echo "Comando: docker logs backend | tail -20"
echo ""
echo -e "${YELLOW}⚠${NC}  Ejecutar manualmente si es necesario"

# RESUMEN FINAL
print_section "RESUMEN FINAL"

echo ""
echo "✅ PASO 2 COMPLETADO"
echo ""
echo "Archivos creados:"
echo "  • solicitudes.helpers.js"
echo "  • solicitudes.controller.js"
echo "  • solicitudes.routes.js"
echo "  • app.js (actualizado)"
echo ""
echo "Endpoints disponibles:"
echo "  • POST /api/solicitudes/herramienta"
echo "  • POST /api/solicitudes/contenedor"
echo "  • POST /api/solicitudes/infraestructura"
echo "  • POST /api/solicitudes/automatizacion"
echo ""
echo "Próximos pasos:"
echo "  1. Revisar documentación: ESTRUCTURA_PASO2.md"
echo "  2. Revisar ejemplos: EJEMPLOS_CURL_PASO2.md"
echo "  3. Probar endpoints con cURL"
echo "  4. Verificar emails y tickets Jira"
echo "  5. Proceder a PASO 3 (Despliegue)"
echo ""
echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}¡LISTO PARA PASO 3!${NC}"
echo -e "${GREEN}========================================================${NC}"
