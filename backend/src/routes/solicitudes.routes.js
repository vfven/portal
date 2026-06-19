/**
 * SOLICITUDES ROUTES
 * Endpoints para solicitudes generales
 * 
 * POST /api/solicitudes/herramienta        → Nueva herramienta/plataforma
 * POST /api/solicitudes/contenedor          → Contenedor/Docker
 * POST /api/solicitudes/infraestructura     → Infraestructura (BD, almacenamiento, etc)
 * POST /api/solicitudes/automatizacion      → Automatización/Pipelines
 */

const express = require('express');
const router = express.Router();
const {
  solicitarNuevaHerramienta,
  solicitarContenedor,
  solicitarInfraestructura,
  solicitarAutomatizacion
} = require('../controllers/solicitudes.controller');

/**
 * POST /api/solicitudes/herramienta
 * Solicitar nueva herramienta o plataforma
 */
router.post('/herramienta', solicitarNuevaHerramienta);

/**
 * POST /api/solicitudes/contenedor
 * Solicitar nuevo contenedor Docker
 */
router.post('/contenedor', solicitarContenedor);

/**
 * POST /api/solicitudes/infraestructura
 * Solicitar infraestructura: base-datos, almacenamiento, load-balancer, networking
 */
router.post('/infraestructura', solicitarInfraestructura);

/**
 * POST /api/solicitudes/automatizacion
 * Solicitar automatización: workflow-github, jenkins-pipeline, automation-script, webhook
 */
router.post('/automatizacion', solicitarAutomatizacion);

module.exports = router;
