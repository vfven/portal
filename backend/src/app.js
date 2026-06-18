const express = require('express');
const cors = require('cors');
const config = require('./config');

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTAR RUTAS
// ═══════════════════════════════════════════════════════════════════════════
const autoservicioRoutes = require('./routes/autoservicio.routes');
const herramientasRoutes = require('./routes/herramientas.routes');
// Más adelante: solicitudesRoutes, despliegueRoutes

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
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRO DE RUTAS
// ═══════════════════════════════════════════════════════════════════════════

// AUTOSERVICIO — Solicitudes simple, VM Cloud, Namespace K8s
app.use('/api/autoservicio', autoservicioRoutes);

// HERRAMIENTAS — Acceso a Jenkins, Bitbucket, ArgoCD, K8s, SonarQube, Grafana, Harbor, Vault
app.use('/api/herramientas', herramientasRoutes);

// SOLICITUDES — Nuevas herramientas, contenedores, infraestructura (cuando esté listo)
// app.use('/api/solicitudes', solicitudesRoutes);

// DESPLIEGUE — Despliegues en K8s On-Prem (cuando esté listo)
// app.use('/api/despliegue', despliegueRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// MANEJO DE ERRORES 404
// ═══════════════════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
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
  console.log(`${'═'.repeat(70)}\n`);
});
