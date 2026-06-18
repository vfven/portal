const express = require('express');
const router = express.Router();
const {
  solicitarAccesoJenkins,
  solicitarAccesoBitbucket,
  solicitarAppArgoCD,
  solicitarAccesoKubernetes,
  solicitarProyectoSonarQube,
  solicitarDashboardGrafana,
  solicitarAccesoHarbor,
  solicitarSecretsVault,
} = require('../controllers/herramientas.controller');

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS PARA SOLICITUDES DE HERRAMIENTAS
// ═══════════════════════════════════════════════════════════════════════════

// JENKINS — Solicitud de acceso
router.post('/jenkins/acceso', solicitarAccesoJenkins);

// BITBUCKET — Solicitud de acceso a repositorio
router.post('/bitbucket/acceso', solicitarAccesoBitbucket);

// ARGO CD — Solicitud de registro de aplicación
router.post('/argocd/app', solicitarAppArgoCD);

// KUBERNETES — Solicitud de acceso RBAC
router.post('/kubernetes/acceso', solicitarAccesoKubernetes);

// SONARQUBE — Solicitud de nuevo proyecto
router.post('/sonarqube/proyecto', solicitarProyectoSonarQube);

// GRAFANA — Solicitud de nuevo dashboard
router.post('/grafana/dashboard', solicitarDashboardGrafana);

// HARBOR — Solicitud de acceso a registry
router.post('/harbor/acceso', solicitarAccesoHarbor);

// VAULT — Solicitud para almacenamiento de secretos
router.post('/vault/secrets', solicitarSecretsVault);

module.exports = router;
