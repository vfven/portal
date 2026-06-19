const crypto = require('crypto');
const {
  enviarCorreoEquipo,
  enviarCorreoSolicitante,
  escapeHtml,
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
 * Valida los datos según el tipo de solicitud general.
 * Retorna { valido: boolean, errores: [] }
 */
function validarSolicitudGeneral(datos, tipoSolicitud) {
  const errores = [];

  // Validaciones comunes
  if (!datos.titulo || !datos.titulo.trim()) {
    errores.push('Título de la solicitud requerido');
  }
  if (!datos.email_solicitante || !datos.email_solicitante.includes('@')) {
    errores.push('Email válido requerido');
  }
  if (!datos.descripcion || !datos.descripcion.trim()) {
    errores.push('Descripción requerida');
  }

  // Validaciones específicas por tipo
  switch (tipoSolicitud) {
    case 'herramienta':
      if (!datos.nombre_herramienta || !datos.nombre_herramienta.trim())
        errores.push('Nombre de la herramienta requerido');
      if (!datos.caso_uso || !datos.caso_uso.trim())
        errores.push('Caso de uso requerido');
      break;

    case 'contenedor':
      if (!datos.nombre_imagen || !datos.nombre_imagen.trim())
        errores.push('Nombre de la imagen requerido');
      if (!datos.tecnologia || !datos.tecnologia.trim())
        errores.push('Stack tecnológico requerido');
      break;

    case 'infraestructura':
      if (!datos.tipo_recurso || !datos.tipo_recurso.trim())
        errores.push('Tipo de recurso requerido (BD, almacenamiento, etc.)');
      if (!datos.ambiente || !['dev', 'qa', 'stg', 'prod'].includes(datos.ambiente))
        errores.push('Ambiente válido requerido (dev/qa/stg/prod)');
      break;

    case 'automatizacion':
      if (!datos.nombre_workflow || !datos.nombre_workflow.trim())
        errores.push('Nombre del workflow requerido');
      if (!datos.trigger || !datos.trigger.trim())
        errores.push('Trigger/evento requerido');
      break;

    default:
      errores.push('Tipo de solicitud no reconocido');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLERS POR CATEGORÍA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * NUEVA HERRAMIENTA / PLATAFORMA
 * Para solicitar herramientas nuevas (GitLab, DataDog, etc.)
 * 
 * Campos: titulo, nombre_herramienta, caso_uso, beneficios, presupuesto, descripcion, email_solicitante
 */
exports.solicitarNuevaHerramienta = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudGeneral(datos, 'herramienta');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    // Sección especial con detalles de la herramienta
    const seccionAdjuntos = `
      <div style="background:#E6F0FA;border-left:4px solid #0052A5;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#0052A5;">
        🔧 <strong>Herramienta:</strong> ${escapeHtml(datos.nombre_herramienta)}<br>
        💡 <strong>Caso de uso:</strong> ${escapeHtml(datos.caso_uso)}<br>
        📈 <strong>Beneficios esperados:</strong> ${escapeHtml(datos.beneficios || 'No especificados')}<br>
        💰 <strong>Presupuesto estimado:</strong> ${escapeHtml(datos.presupuesto || 'A definir')}
      </div>`;

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[Nueva Herramienta] ${datos.nombre_herramienta} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Nueva Herramienta',
      labels: ['nueva-herramienta', 'evaluacion', datos.nombre_herramienta.toLowerCase().replace(/\s/g, '-')],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de nueva herramienta ${datos.nombre_herramienta} enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * CONTENEDOR / IMAGEN DOCKER PERSONALIZADA
 * Para solicitar imágenes Docker customizadas o registros especiales
 * 
 * Campos: titulo, nombre_imagen, tecnologia, base_image, dependencias, descripcion, email_solicitante
 */
exports.solicitarContenedor = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudGeneral(datos, 'contenedor');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    // Sección con especificaciones técnicas
    const seccionAdjuntos = `
      <div style="background:#FEF5E6;border-left:4px solid #C47D00;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#C47D00;">
        📦 <strong>Nombre Imagen:</strong> ${escapeHtml(datos.nombre_imagen)}<br>
        💻 <strong>Stack Tecnológico:</strong> ${escapeHtml(datos.tecnologia)}<br>
        🏗️ <strong>Imagen Base:</strong> ${escapeHtml(datos.base_image || 'Alpine/Ubuntu default')}<br>
        📚 <strong>Dependencias:</strong> ${escapeHtml(datos.dependencias || 'A documentar')}
      </div>`;

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[Contenedor] ${datos.nombre_imagen} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Contenedor',
      labels: ['contenedor', 'docker', datos.tecnologia.toLowerCase().replace(/\s/g, '-')],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de contenedor ${datos.nombre_imagen} enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * INFRAESTRUCTURA (BD, Almacenamiento, Load Balancers, etc.)
 * Para provisioning de recursos de infraestructura
 * 
 * Campos: titulo, tipo_recurso, ambiente, especificaciones, sla_requerido, backup, descripcion, email_solicitante
 */
exports.solicitarInfraestructura = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudGeneral(datos, 'infraestructura');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    // Sección con especificaciones de infraestructura
    const seccionAdjuntos = `
      <div style="background:#EDE9FE;border-left:4px solid #5B21B6;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#5B21B6;">
        🏢 <strong>Tipo de Recurso:</strong> ${escapeHtml(datos.tipo_recurso)}<br>
        🌍 <strong>Ambiente:</strong> ${escapeHtml(datos.ambiente.toUpperCase())}<br>
        ⚙️ <strong>Especificaciones:</strong> ${escapeHtml(datos.especificaciones || 'A definir')}<br>
        📊 <strong>SLA Requerido:</strong> ${escapeHtml(datos.sla_requerido || '99.5%')}<br>
        💾 <strong>Backup/Replicación:</strong> ${escapeHtml(datos.backup || 'Estándar')}
      </div>`;

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[Infraestructura] ${datos.tipo_recurso} en ${datos.ambiente.toUpperCase()} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Infraestructura',
      labels: ['infraestructura', datos.tipo_recurso.toLowerCase().replace(/\s/g, '-'), datos.ambiente],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de infraestructura (${datos.tipo_recurso}) enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * AUTOMATIZACIÓN / PIPELINE / WORKFLOW
 * Para crear workflows, pipelines custom o scripts automatizados
 * 
 * Campos: titulo, nombre_workflow, trigger, acciones, frecuencia, descripcion, email_solicitante
 */
exports.solicitarAutomatizacion = async (req, res) => {
  try {
    const datos = req.body;
    const validacion = validarSolicitudGeneral(datos, 'automatizacion');

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores,
      });
    }

    const idSolicitud = generarId();

    // Sección con detalles del workflow
    const seccionAdjuntos = `
      <div style="background:#E6F4EA;border-left:4px solid #1E7B48;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#1E7B48;">
        ⚡ <strong>Nombre del Workflow:</strong> ${escapeHtml(datos.nombre_workflow)}<br>
        🔔 <strong>Trigger/Evento:</strong> ${escapeHtml(datos.trigger)}<br>
        📋 <strong>Acciones:</strong> ${escapeHtml(datos.acciones || 'A definir')}<br>
        🕐 <strong>Frecuencia:</strong> ${escapeHtml(datos.frecuencia || 'Event-triggered')}
      </div>`;

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[Automatización] ${datos.nombre_workflow} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Automatización',
      labels: ['automatizacion', 'workflow', 'pipeline', datos.trigger.toLowerCase().replace(/\s/g, '-')],
    });

    return res.status(200).json({
      success: true,
      id: idSolicitud,
      jiraTicket: jiraKey,
      mensaje: `Solicitud de automatización (${datos.nombre_workflow}) enviada. ID: ${idSolicitud}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
