const express = require('express');
const router = express.Router();
const {
  solicitarNuevaHerramienta,
  solicitarContenedor,
  solicitarInfraestructura,
  solicitarAutomatizacion,
} = require('../controllers/solicitudes.controller');

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS PARA SOLICITUDES GENERALES
// ═══════════════════════════════════════════════════════════════════════════

// Nueva Herramienta / Plataforma
router.post('/nueva-herramienta', solicitarNuevaHerramienta);

// Contenedor / Imagen Docker personalizada
router.post('/contenedor', solicitarContenedor);

// Infraestructura (BD, almacenamiento, LB, etc.)
router.post('/infraestructura', solicitarInfraestructura);

// Automatización / Pipeline / Workflow
router.post('/automatizacion', solicitarAutomatizacion);

module.exports = router;
