/**
 * DESPLIEGUE ROUTES
 * Endpoints para despliegues en Kubernetes
 * 
 * POST /api/despliegue/kubernetes        → Despliegue en K8s + subir a Bitbucket
 * POST /api/despliegue/jenkins-trigger   → Trigger Jenkins job
 * POST /api/despliegue/rollback          → Rollback a versión anterior
 */

const express = require('express');
const router = express.Router();
const {
  despliegarEnKubernetes,
  triggerJenkins,
  realizarRollback
} = require('../controllers/despliegue.controller');

/**
 * POST /api/despliegue/kubernetes
 * Despliegue en Kubernetes + generación de manifiestos + subida a Bitbucket
 */
router.post('/kubernetes', despliegarEnKubernetes);

/**
 * POST /api/despliegue/jenkins-trigger
 * Dispara un job de Jenkins
 */
router.post('/jenkins-trigger', triggerJenkins);

/**
 * POST /api/despliegue/rollback
 * Realiza rollback de un deployment
 */
router.post('/rollback', realizarRollback);

module.exports = router;
