const express = require('express');
const cors = require('cors');
const config = require('./config');

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTAR RUTAS
// ═══════════════════════════════════════════════════════════════════════════
const autoservicioRoutes = require('./routes/autoservicio.routes');
const herramientasRoutes = require('./routes/herramientas.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const despliegueRoutes = require('./routes/despliegue.routes');

// ═══════════════════════════════════════════════════════════════════════════
// INSTANCIA EXPRESS
// ═══════════════════════════════════════════════════════════════════════════
const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT REQUERIDO POR KUBERNETES (Liveness/Readiness Probe)
// ═══════════════════════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    environment: config.NODE_ENV,
    service: 'devops-portal-backend',
    timestamp: new Date().toISOString(),
    endpoints: {
      autoservicio: 3,
      herramientas: 8,
      solicitudes: 4,
      despliegue: 3,
      total: 18
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRO DE RUTAS
// ═══════════════════════════════════════════════════════════════════════════

// AUTOSERVICIO — Solicitudes simple, VM Cloud, Namespace K8s
app.use('/api/autoservicio', autoservicioRoutes);

// HERRAMIENTAS — Acceso a Jenkins, Bitbucket, ArgoCD, K8s, SonarQube, Grafana, Harbor, Vault
app.use('/api/herramientas', herramientasRoutes);

// SOLICITUDES GENERALES — Nueva herramienta, contenedor, infraestructura, automatización
app.use('/api/solicitudes', solicitudesRoutes);

// DESPLIEGUE — Despliegues en K8s On-Prem + Jenkins + Rollback   ACTIVADO
app.use('/api/despliegue', despliegueRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// MANEJO DE ERRORES 404
// ═══════════════════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    endpoints: {
      autoservicio: 3,
      herramientas: 8,
      solicitudes: 4,
      despliegue: 3,
      total: 18
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════════════════════
app.listen(config.PORT, () => {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🚀 Backend corriendo en modo [${config.NODE_ENV}]`);
  console.log(`📍 Puerto: ${config.PORT}`);
  console.log(`📧 SMTP Configurado: ${config.SMTP_HOST && config.SMTP_USER ? 'SÍ' : 'NO'}`);
  console.log(`📋 JIRA Configurado: ${config.JIRA_API_TOKEN && config.JIRA_API_TOKEN !== 'tu_api_token' ? 'SÍ' : 'NO'}`);
  console.log(`📦 Bitbucket Configurado: ${config.BITBUCKET_APP_PASSWORD ? 'SÍ' : 'NO'}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`\n✅ ENDPOINTS DISPONIBLES:\n`);
  console.log(`   AUTOSERVICIO (3):`);
  console.log(`     POST /api/autoservicio/solicitud-simple`);
  console.log(`     POST /api/autoservicio/solicitud-vm`);
  console.log(`     POST /api/autoservicio/solicitud-namespace\n`);
  console.log(`   HERRAMIENTAS (8):`);
  console.log(`     POST /api/herramientas/jenkins/acceso`);
  console.log(`     POST /api/herramientas/bitbucket/acceso`);
  console.log(`     POST /api/herramientas/argocd/app`);
  console.log(`     POST /api/herramientas/kubernetes/acceso`);
  console.log(`     POST /api/herramientas/sonarqube/proyecto`);
  console.log(`     POST /api/herramientas/grafana/dashboard`);
  console.log(`     POST /api/herramientas/harbor/acceso`);
  console.log(`     POST /api/herramientas/vault/secrets\n`);
  console.log(`   SOLICITUDES (4):`);
  console.log(`     POST /api/solicitudes/herramienta`);
  console.log(`     POST /api/solicitudes/contenedor`);
  console.log(`     POST /api/solicitudes/infraestructura`);
  console.log(`     POST /api/solicitudes/automatizacion\n`);
  console.log(`   DESPLIEGUE (3):`);
  console.log(`     POST /api/despliegue/kubernetes`);
  console.log(`     POST /api/despliegue/jenkins-trigger`);
  console.log(`     POST /api/despliegue/rollback\n`);
  console.log(`   HEALTH: GET /health\n`);
  console.log(`${'═'.repeat(70)}\n`);
});

module.exports = app;
