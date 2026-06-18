const express = require('express');
const router = express.Router();
const {
  procesarSolicitudSimple,
  procesarSolicitudVMCloud,
  procesarSolicitudNamespaceK8s,
} = require('../controllers/autoservicio.controller');

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS PARA AUTOSERVICIO
// ═══════════════════════════════════════════════════════════════════════════

// Solicitud genérica/simple (accesos, secretos, etc.)
router.post('/solicitud-simple', procesarSolicitudSimple);

// Solicitud de VM en Cloud (AWS, Azure, GCP)
router.post('/solicitud-vm', procesarSolicitudVMCloud);

// Solicitud de Namespace en Kubernetes
router.post('/solicitud-namespace', procesarSolicitudNamespaceK8s);

module.exports = router;
