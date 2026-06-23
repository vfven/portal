/**
 * CHAT ROUTES
 * POST /api/chat         → Enviar mensaje al asistente IA
 * GET  /api/chat/estado  → Verificar si Ollama y el modelo están disponibles
 */

const express = require('express');
const router  = express.Router();
const { procesarChat, estadoIA } = require('../controllers/chat.controller');

router.post('/',       procesarChat);
router.get('/estado',  estadoIA);

module.exports = router;
