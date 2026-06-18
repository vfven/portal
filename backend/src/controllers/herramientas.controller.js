const crypto = require('crypto');
const {
  enviarCorreoEquipo,
  enviarCorreoSolicitante,
  construirTablaHtml,
  renderPlantilla,
  escapeHtml
} = require('../helpers/mail.helpers');
const {
  crearTicketJira,
} = require('../helpers/jira.helpers');

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES COMPARTIDAS
// ═══════════════════════════════════════════════════════════════════════════

function generarId() {
  return 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Valida los datos según el tipo de herramienta solicitada.
 * Retorna { valido: boolean, errores: [] }
 */
function validarSolicitudHerramienta(datos, tipoHerramienta) {
  const errores = [];

  // Validaciones comunes
  if (!datos.nombreServicio || !datos.nombreServicio.trim()) {
    errores.push('Nombre de servicio requerido');
  }
  if (!datos.email_solicitante || !datos.email_solicitante.includes('@')) {
    errores.push('Email válido requerido');
  }

  // Validaciones específicas por herramienta
  switch (tipoHerramienta) {
    case 'jenkins':
      if (!datos.usuario || !datos.usuario.trim()) errores.push('Usuario corporativo requerido');
      if (!datos.rol || !datos.rol.trim()) errores.push('Rol requerido (admin/usuario/lectura)');
      break;

    case 'bitbucket':
      if (!datos.usuario || !datos.usuario.trim()) errores.push('Usuario corporativo requerido');
      if (!datos.repositorio || !datos.repositorio.trim()) errores.push('Repositorio requerido (ej: equipo/repo)');
      if (!datos.permisos || datos.permisos.length === 0) errores.push('Al menos un permiso debe ser seleccionado');
      break;

    case 'argocd':
      if (!datos.namespace || !datos.namespace.trim()) errores.push('Namespace requerido');
      if (!datos.ambiente || !['dev', 'staging', 'prod'].includes(datos.ambiente)) {
        errores.push('Ambiente válido requerido (dev/staging/prod)');
      }
      break;

    case 'kubernetes':
      if (!datos.usuario || !datos.usuario.trim()) errores.push('Usuario corporativo requerido');
      if (!datos.cluster || !datos.cluster.trim()) errores.push('Clúster requerido');
      if (!datos.namespace || !datos.namespace.trim()) errores.push('Namespace requerido');
      break;

    case 'sonarqube':
      if (!datos.proyecto || !datos.proyecto.trim()) errores.push('Nombre del proyecto requerido');
      if (!datos.rama || !datos.rama.trim()) errores.push('Rama requerida');
      break;

    case 'grafana':
      if (!datos.dashboard || !datos.dashboard.trim()) errores.push('Nombre del dashboard requerido');
      if (!datos.metricas || datos.metricas.length === 0) errores.push('Al menos una métrica debe ser seleccionada');
      break;

    case 'harbor':
      if (!datos.proyecto || !datos.proyecto.trim()) errores.push('Proyecto en Harbor requerido');
      if (!datos.usuario || !datos.usuario.trim()) errores.push('Usuario corporativo requerido');
      break;

    case 'vault':
      if (!datos.path || !datos.path.trim()) errores.push('Path en Vault requerido (ej: secret/app/nombre)');
      if (!datos.secretos || datos.secretos.length === 0) errores.push('Lista de secretos requerida');
      break;

    default:
      errores.push('Tipo de herramienta no reconocido');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLERS POR HERRAMIENTA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * JENKINS — Solicitud de acceso
 * Campos: usuario, rol (admin/usuario/lectura), instancia, justificación
 */
exports.solicitarAccesoJenkins = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudHerramienta(datos, 'jenkins');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    // Enviar correos
    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[Jenkins Acceso] ${datos.usuario} - ${idSolicitud}`,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    // Crear ticket en Jira
    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Acceso Jenkins',
      labels: ['jenkins', 'acceso', datos.rol.toLowerCase()],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de acceso Jenkins enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * BITBUCKET — Solicitud de acceso a repositorio
 * Campos: usuario, repositorio, permisos (array), justificación
 */
exports.solicitarAccesoBitbucket = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudHerramienta(datos, 'bitbucket');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    // Formatear permisos como string legible
    const permisosTexto = Array.isArray(datos.permisos)
      ? datos.permisos.join(', ')
      : datos.permisos;

    const datosFormato = { ...datos, permisos: permisosTexto };

    await enviarCorreoEquipo(datosFormato, idSolicitud, {
      subject: `[Bitbucket Acceso] ${datos.usuario} a ${datos.repositorio} - ${idSolicitud}`,
    });
    await enviarCorreoSolicitante(datosFormato, idSolicitud);

    const jiraKey = await crearTicketJira(datosFormato, idSolicitud, {
      tipoIssue: 'Acceso Bitbucket',
      labels: ['bitbucket', 'acceso', 'repositorio'],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de acceso a Bitbucket enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ARGO CD — Solicitud de registro de aplicación en GitOps
 * Campos: namespace, ambiente (dev/staging/prod), aplicacion, descripcion
 */
exports.solicitarAppArgoCD = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudHerramienta(datos, 'argocd');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    const seccionAdjuntos = `
      <div style="background:#e6f4ea;border-left:4px solid #1e7b48;padding:12px 16px;border-radius:6px;margin:16px 0;font-size:13px;color:#1e7b48;">
        📌 <strong>Ambiente:</strong> ${escapeHtml(datos.ambiente)}<br>
        📁 <strong>Namespace:</strong> ${escapeHtml(datos.namespace)}<br>
        🎯 <strong>Aplicación:</strong> ${escapeHtml(datos.aplicacion || 'No especificada')}
      </div>`;

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[ArgoCD App] ${datos.aplicacion} en ${datos.ambiente} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'App ArgoCD',
      labels: ['argocd', 'gitops', datos.ambiente],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de aplicación en Argo CD enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * KUBERNETES — Solicitud de acceso RBAC
 * Campos: usuario, cluster, namespace(s), justificacion
 */
exports.solicitarAccesoKubernetes = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudHerramienta(datos, 'kubernetes');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[K8s RBAC] ${datos.usuario} en ${datos.cluster} - ${idSolicitud}`,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Acceso Kubernetes',
      labels: ['kubernetes', 'rbac', 'acceso'],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de acceso Kubernetes enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * SONARQUBE — Solicitud de nuevo proyecto
 * Campos: proyecto, rama, lenguaje, descripcion
 */
exports.solicitarProyectoSonarQube = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudHerramienta(datos, 'sonarqube');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    const seccionAdjuntos = `
      <div style="background:#E6F0FA;border-left:4px solid #0052A5;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#0052A5;">
        📊 <strong>Proyecto:</strong> ${escapeHtml(datos.proyecto)}<br>
        🌿 <strong>Rama principal:</strong> ${escapeHtml(datos.rama)}<br>
        💻 <strong>Lenguaje:</strong> ${escapeHtml(datos.lenguaje || 'Auto-detectado')}
      </div>`;

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[SonarQube] Nuevo proyecto ${datos.proyecto} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Proyecto SonarQube',
      labels: ['sonarqube', 'quality', 'nuevo-proyecto'],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de proyecto SonarQube enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GRAFANA — Solicitud de nuevo dashboard
 * Campos: dashboard, metricas (array), dataSource, descripcion
 */
exports.solicitarDashboardGrafana = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudHerramienta(datos, 'grafana');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    const metricasTexto = Array.isArray(datos.metricas)
      ? datos.metricas.join(', ')
      : datos.metricas;

    const datosFormato = { ...datos, metricas: metricasTexto };

    const seccionAdjuntos = `
      <div style="background:#FEF5E6;border-left:4px solid #C47D00;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#C47D00;">
        📈 <strong>Métricas:</strong> ${escapeHtml(metricasTexto)}<br>
        🔌 <strong>Data Source:</strong> ${escapeHtml(datos.dataSource || 'Prometheus')}
      </div>`;

    await enviarCorreoEquipo(datosFormato, idSolicitud, {
      subject: `[Grafana] Dashboard ${datos.dashboard} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datosFormato, idSolicitud);

    const jiraKey = await crearTicketJira(datosFormato, idSolicitud, {
      tipoIssue: 'Dashboard Grafana',
      labels: ['grafana', 'monitoring', 'dashboard'],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de dashboard Grafana enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * HARBOR — Solicitud de acceso a registry
 * Campos: usuario, proyecto, permisos (read/write/admin), descripcion
 */
exports.solicitarAccesoHarbor = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudHerramienta(datos, 'harbor');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    const seccionAdjuntos = `
      <div style="background:#EDE9FE;border-left:4px solid #5B21B6;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#5B21B6;">
        🗂️ <strong>Proyecto:</strong> ${escapeHtml(datos.proyecto)}<br>
        🔐 <strong>Permisos:</strong> ${escapeHtml(datos.permisos || 'read')}
      </div>`;

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[Harbor] Acceso a ${datos.proyecto} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Acceso Harbor',
      labels: ['harbor', 'registry', 'acceso'],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de acceso a Harbor enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * VAULT — Solicitud para almacenamiento de secretos
 * Campos: path (ej: secret/app/nombre), secretos (array de nombres), descripcion
 */
exports.solicitarSecretsVault = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudHerramienta(datos, 'vault');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    const secretosTexto = Array.isArray(datos.secretos)
      ? datos.secretos.join(', ')
      : datos.secretos;

    const datosFormato = { ...datos, secretos: secretosTexto };

    const seccionAdjuntos = `
      <div style="background:#FEF2EF;border-left:4px solid #C23D1C;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#C23D1C;">
        🔑 <strong>Path:</strong> <code>${escapeHtml(datos.path)}</code><br>
        📋 <strong>Secretos:</strong> ${escapeHtml(secretosTexto)}
      </div>`;

    await enviarCorreoEquipo(datosFormato, idSolicitud, {
      subject: `[Vault] Secretos en ${datos.path} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datosFormato, idSolicitud);

    const jiraKey = await crearTicketJira(datosFormato, idSolicitud, {
      tipoIssue: 'Secretos Vault',
      labels: ['vault', 'secrets', 'security'],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de secretos en Vault enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
