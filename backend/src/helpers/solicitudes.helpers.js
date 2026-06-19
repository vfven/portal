/**
 * SOLICITUDES HELPERS
 * Validadores y constructores para solicitudes generales
 * Categorías: Herramientas, Contenedores, Infraestructura, Automatización
 */

const { construirTablaHtml, renderPlantilla, enviarCorreoEquipo, enviarCorreoSolicitante } = require('./mail.helpers');
const { crearTicketJira } = require('./jira.helpers');

/**
 * VALIDADORES POR CATEGORÍA
 */

/**
 * Valida solicitud de NUEVA HERRAMIENTA
 * @param {Object} datos - { nombreHerramienta, descripcion, razon, enlaces, presupuesto, email_solicitante }
 * @returns {Object} { valido, errores }
 */
function validarNuevaHerramienta(datos) {
  const errores = [];

  if (!datos.nombreHerramienta?.trim()) errores.push('nombreHerramienta es requerido');
  if (!datos.descripcion?.trim()) errores.push('descripcion es requerida');
  if (!datos.razon?.trim()) errores.push('razon es requerida');
  if (!datos.email_solicitante?.trim()) errores.push('email_solicitante es requerido');
  if (!datos.email_solicitante?.includes('@')) errores.push('email_solicitante debe ser un correo válido');

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Valida solicitud de CONTENEDOR/DOCKER
 * @param {Object} datos - { nombreContenedor, baseImage, puertos, volumenes, variables, justificacion, email_solicitante }
 * @returns {Object} { valido, errores }
 */
function validarContenedor(datos) {
  const errores = [];

  if (!datos.nombreContenedor?.trim()) errores.push('nombreContenedor es requerido');
  if (!datos.baseImage?.trim()) errores.push('baseImage es requerida (ej: ubuntu:22.04, node:18)');
  if (!datos.justificacion?.trim()) errores.push('justificacion es requerida');
  if (!datos.email_solicitante?.trim()) errores.push('email_solicitante es requerido');
  if (!datos.email_solicitante?.includes('@')) errores.push('email_solicitante debe ser un correo válido');

  // Puertos: validar formato "8080:8080/tcp" si existen
  if (datos.puertos && Array.isArray(datos.puertos)) {
    datos.puertos.forEach((puerto, idx) => {
      if (!/^\d{1,5}:\d{1,5}\/(tcp|udp)$/.test(puerto)) {
        errores.push(`puertos[${idx}] debe tener formato "puerto_host:puerto_contenedor/(tcp|udp)"`);
      }
    });
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Valida solicitud de INFRAESTRUCTURA
 * @param {Object} datos - { tipoInfraestructura, descripcion, especificaciones, ambiente, email_solicitante }
 * tipoInfraestructura: "base-datos" | "almacenamiento" | "load-balancer" | "networking"
 * @returns {Object} { valido, errores }
 */
function validarInfraestructura(datos) {
  const errores = [];
  const tiposValidos = ['base-datos', 'almacenamiento', 'load-balancer', 'networking'];

  if (!datos.tipoInfraestructura?.trim()) errores.push('tipoInfraestructura es requerido');
  if (datos.tipoInfraestructura && !tiposValidos.includes(datos.tipoInfraestructura)) {
    errores.push(`tipoInfraestructura debe ser uno de: ${tiposValidos.join(', ')}`);
  }

  if (!datos.descripcion?.trim()) errores.push('descripcion es requerida');
  if (!datos.especificaciones?.trim()) errores.push('especificaciones son requeridas');
  if (!datos.ambiente?.trim()) errores.push('ambiente es requerido (dev/staging/prod)');
  if (!datos.email_solicitante?.trim()) errores.push('email_solicitante es requerido');
  if (!datos.email_solicitante?.includes('@')) errores.push('email_solicitante debe ser un correo válido');

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Valida solicitud de AUTOMATIZACIÓN/PIPELINE
 * @param {Object} datos - { nombrePipeline, tipo, descripcion, triggers, etapas, email_solicitante }
 * tipo: "workflow-github" | "jenkins-pipeline" | "automation-script" | "webhook"
 * @returns {Object} { valido, errores }
 */
function validarAutomatizacion(datos) {
  const errores = [];
  const tiposValidos = ['workflow-github', 'jenkins-pipeline', 'automation-script', 'webhook'];

  if (!datos.nombrePipeline?.trim()) errores.push('nombrePipeline es requerido');
  if (!datos.tipo?.trim()) errores.push('tipo es requerido');
  if (datos.tipo && !tiposValidos.includes(datos.tipo)) {
    errores.push(`tipo debe ser uno de: ${tiposValidos.join(', ')}`);
  }

  if (!datos.descripcion?.trim()) errores.push('descripcion es requerida');
  if (!datos.email_solicitante?.trim()) errores.push('email_solicitante es requerido');
  if (!datos.email_solicitante?.includes('@')) errores.push('email_solicitante debe ser un correo válido');

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * CONSTRUCTORES DE DETALLES PARA EMAIL/JIRA
 */

/**
 * Construye detalles para solicitud de NUEVA HERRAMIENTA
 */
function construirDetallesHerramienta(datos) {
  return [
    { label: 'Nombre Herramienta', valor: datos.nombreHerramienta },
    { label: 'Descripción', valor: datos.descripcion },
    { label: 'Razón de la Solicitud', valor: datos.razon },
    { label: 'Enlaces Relevantes', valor: datos.enlaces || 'N/A' },
    { label: 'Presupuesto Estimado', valor: datos.presupuesto || 'N/A' },
    { label: 'Solicitante', valor: datos.email_solicitante }
  ];
}

/**
 * Construye detalles para solicitud de CONTENEDOR
 */
function construirDetallesContenedor(datos) {
  const puertosFormato = Array.isArray(datos.puertos) ? datos.puertos.join(', ') : datos.puertos || 'N/A';
  const volumenesFormato = Array.isArray(datos.volumenes) ? datos.volumenes.join(', ') : datos.volumenes || 'N/A';
  const variablesFormato = Array.isArray(datos.variables) ? datos.variables.join(', ') : datos.variables || 'N/A';

  return [
    { label: 'Nombre Contenedor', valor: datos.nombreContenedor },
    { label: 'Imagen Base', valor: datos.baseImage },
    { label: 'Puertos', valor: puertosFormato },
    { label: 'Volúmenes', valor: volumenesFormato },
    { label: 'Variables de Entorno', valor: variablesFormato },
    { label: 'Justificación', valor: datos.justificacion },
    { label: 'Solicitante', valor: datos.email_solicitante }
  ];
}

/**
 * Construye detalles para solicitud de INFRAESTRUCTURA
 */
function construirDetallesInfraestructura(datos) {
  return [
    { label: 'Tipo de Infraestructura', valor: datos.tipoInfraestructura },
    { label: 'Descripción', valor: datos.descripcion },
    { label: 'Especificaciones', valor: datos.especificaciones },
    { label: 'Ambiente', valor: datos.ambiente },
    { label: 'Dependencias', valor: datos.dependencias || 'N/A' },
    { label: 'Timeline', valor: datos.timeline || 'N/A' },
    { label: 'Solicitante', valor: datos.email_solicitante }
  ];
}

/**
 * Construye detalles para solicitud de AUTOMATIZACIÓN
 */
function construirDetallesAutomatizacion(datos) {
  const etapasFormato = Array.isArray(datos.etapas) ? datos.etapas.join(', ') : datos.etapas || 'N/A';
  const triggersFormato = Array.isArray(datos.triggers) ? datos.triggers.join(', ') : datos.triggers || 'N/A';

  return [
    { label: 'Nombre Pipeline', valor: datos.nombrePipeline },
    { label: 'Tipo', valor: datos.tipo },
    { label: 'Descripción', valor: datos.descripcion },
    { label: 'Triggers', valor: triggersFormato },
    { label: 'Etapas', valor: etapasFormato },
    { label: 'Documentación', valor: datos.documentacion || 'N/A' },
    { label: 'Solicitante', valor: datos.email_solicitante }
  ];
}

/**
 * PROCESADOR GENÉRICO DE SOLICITUD
 * Consolida email + Jira para cualquier categoría
 */
async function procesarSolicitudGenerica(
  datos,
  idSolicitud,
  {
    categoria,        // "herramienta" | "contenedor" | "infraestructura" | "automatizacion"
    titulo,
    detalles,
    jiraLabels = []
  }
) {
  try {
    // Construir tabla HTML con detalles
    const tablaHtml = construirTablaHtml(
      detalles,
      idSolicitud,
      ['solicitante']  // Excluir campo solicitante de la tabla (va en correo)
    );

    // Email al equipo DevSecOps
    const seccionAdjuntosEquipo = `
      <div style="margin-top: 20px; border-top: 2px solid #002B5C; padding-top: 15px;">
        <h3 style="color: #002B5C; font-size: 14px; margin: 10px 0;">📋 Acción Requerida</h3>
        <p style="color: #333; font-size: 13px; margin: 5px 0;">
          Por favor revisar y procesar esta solicitud de <strong>${categoria}</strong> en Jira.
        </p>
        <p style="color: #666; font-size: 12px; margin: 5px 0; font-style: italic;">
          Ticket: <strong>${idSolicitud}</strong>
        </p>
      </div>
    `;

    await enviarCorreoEquipo(detalles, idSolicitud, {
      subject: `[SOLICITUD] ${titulo} - ${idSolicitud}`,
      seccionAdjuntos: seccionAdjuntosEquipo
    });

    // Email al solicitante
    await enviarCorreoSolicitante(detalles, idSolicitud);

    // Crear ticket en Jira
    const ticketJira = await crearTicketJira(detalles, idSolicitud, {
      tipoIssue: process.env.JIRA_TYPE_SOLICITUD || '10428',
      labels: [`solicitud-${categoria}`, ...jiraLabels]
    });

    return {
      success: true,
      id: idSolicitud,
      jiraTicket: ticketJira,
      mensaje: `Solicitud de ${categoria} registrada exitosamente`
    };
  } catch (error) {
    console.error(`Error procesando solicitud ${idSolicitud}:`, error);
    throw error;
  }
}

module.exports = {
  // Validadores
  validarNuevaHerramienta,
  validarContenedor,
  validarInfraestructura,
  validarAutomatizacion,

  // Constructores de detalles
  construirDetallesHerramienta,
  construirDetallesContenedor,
  construirDetallesInfraestructura,
  construirDetallesAutomatizacion,

  // Procesador genérico
  procesarSolicitudGenerica
};
