const express = require('express');
const cors = require('cors');
const config = require('./config');
const controllers = require('./controllers');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== ENDPOINT REQUERIDO POR KUBERNETES (Liveness/Readiness Probe) ======
app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    environment: config.NODE_ENV,
    service: 'devops-portal-backend'
  });
});

// ====== RUTAS DEL PORTAL ======
// Reemplaza tus llamadas de Google Apps Script por estas API REST locales
app.post('/api/solicitud-simple', controllers.procesarSolicitudSimple);
app.post('/api/solicitud-vm', controllers.procesarSolicitudVMCloud);

// Captura de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(config.PORT, () => {
  console.log(`🚀 Backend corriendo en modo [${config.NODE_ENV}] sobre el puerto ${config.PORT}`);
});
