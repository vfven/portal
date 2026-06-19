/**
 * SOLICITUDES CONTROLLER
 * Maneja solicitudes generales: herramientas, contenedores, infraestructura, automatización
 * 
 * Cada categoría tiene validación específica, detalles personalizados y labels Jira únicos
 */

const crypto = require('crypto');
const {
  validarNuevaHerramienta,
  validarContenedor,
  validarInfraestructura,
  validarAutomatizacion,
  construirDetallesHerramienta,
  construirDetallesContenedor,
  construirDetallesInfraestructura,
  construirDetallesAutomatizacion,
  procesarSolicitudGenerica
} = require('../helpers/solicitudes.helpers');

/**
 * Genera ID único para solicitudes: REQ-XXXXXXXX
 */
function generarIdSolicitud() {
  return 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * CATEGORÍA 1: NUEVA HERRAMIENTA/PLATAFORMA
 * POST /api/solicitudes/herramienta
 * 
 * Body: {
 *   nombreHerramienta: "GitLab",
 *   descripcion: "Sistema de control de versiones descentralizado",
 *   razon: "Ampliar opciones de CI/CD",
 *   enlaces: "https://gitlab.com",
 *   presupuesto: "$5000 USD",
 *   email_solicitante: "jperez@bancobase.com"
 * }
 */
async function solicitarNuevaHerramienta(req, res) {
  try {
    const { 
      nombreHerramienta, 
      descripcion, 
      razon, 
      enlaces, 
      presupuesto, 
      email_solicitante 
    } = req.body;

    // Validar
    const validacion = validarNuevaHerramienta({
      nombreHerramienta,
      descripcion,
      razon,
      email_solicitante
    });

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores
      });
    }

    // Generar ID
    const idSolicitud = generarIdSolicitud();

    // Construir detalles
    const detalles = construirDetallesHerramienta({
      nombreHerramienta,
      descripcion,
      razon,
      enlaces,
      presupuesto,
      email_solicitante
    });

    // Procesar
    const resultado = await procesarSolicitudGenerica(
      detalles,
      idSolicitud,
      {
        categoria: 'herramienta',
        titulo: `Nueva Herramienta: ${nombreHerramienta}`,
        detalles,
        jiraLabels: ['herramienta', 'nueva-plataforma']
      }
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en solicitarNuevaHerramienta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar solicitud',
      detalles: [error.message]
    });
  }
}

/**
 * CATEGORÍA 2: CONTENEDOR/DOCKER
 * POST /api/solicitudes/contenedor
 * 
 * Body: {
 *   nombreContenedor: "app-analytics",
 *   baseImage: "node:18-alpine",
 *   puertos: ["8080:8080/tcp", "9090:9090/tcp"],
 *   volumenes: ["/data/logs", "/config"],
 *   variables: ["NODE_ENV=production", "LOG_LEVEL=info"],
 *   justificacion: "Necesario para nueva aplicación de análisis",
 *   email_solicitante: "agarcia@bancobase.com"
 * }
 */
async function solicitarContenedor(req, res) {
  try {
    const {
      nombreContenedor,
      baseImage,
      puertos,
      volumenes,
      variables,
      justificacion,
      email_solicitante
    } = req.body;

    // Validar
    const validacion = validarContenedor({
      nombreContenedor,
      baseImage,
      puertos,
      justificacion,
      email_solicitante
    });

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores
      });
    }

    // Generar ID
    const idSolicitud = generarIdSolicitud();

    // Construir detalles
    const detalles = construirDetallesContenedor({
      nombreContenedor,
      baseImage,
      puertos,
      volumenes,
      variables,
      justificacion,
      email_solicitante
    });

    // Procesar
    const resultado = await procesarSolicitudGenerica(
      detalles,
      idSolicitud,
      {
        categoria: 'contenedor',
        titulo: `Nuevo Contenedor: ${nombreContenedor}`,
        detalles,
        jiraLabels: ['docker', 'contenedor', 'registry']
      }
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en solicitarContenedor:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar solicitud',
      detalles: [error.message]
    });
  }
}

/**
 * CATEGORÍA 3: INFRAESTRUCTURA
 * POST /api/solicitudes/infraestructura
 * 
 * Body: {
 *   tipoInfraestructura: "base-datos",
 *   descripcion: "PostgreSQL para aplicación de reportes",
 *   especificaciones: "PostgreSQL 14, 4 vCPU, 16GB RAM, 500GB SSD",
 *   ambiente: "prod",
 *   dependencias: "VPC-Principal, Subnet-Privada",
 *   timeline: "2 semanas",
 *   email_solicitante: "mlopez@bancobase.com"
 * }
 */
async function solicitarInfraestructura(req, res) {
  try {
    const {
      tipoInfraestructura,
      descripcion,
      especificaciones,
      ambiente,
      dependencias,
      timeline,
      email_solicitante
    } = req.body;

    // Validar
    const validacion = validarInfraestructura({
      tipoInfraestructura,
      descripcion,
      especificaciones,
      ambiente,
      email_solicitante
    });

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores
      });
    }

    // Generar ID
    const idSolicitud = generarIdSolicitud();

    // Construir detalles
    const detalles = construirDetallesInfraestructura({
      tipoInfraestructura,
      descripcion,
      especificaciones,
      ambiente,
      dependencias,
      timeline,
      email_solicitante
    });

    // Labels dinámicos según tipo
    const labelsAdicionales = {
      'base-datos': ['database', 'sql'],
      'almacenamiento': ['storage', 's3'],
      'load-balancer': ['networking', 'alb'],
      'networking': ['network', 'infrastructure']
    };

    // Procesar
    const resultado = await procesarSolicitudGenerica(
      detalles,
      idSolicitud,
      {
        categoria: 'infraestructura',
        titulo: `Nueva Infraestructura: ${tipoInfraestructura}`,
        detalles,
        jiraLabels: ['infraestructura', ...(labelsAdicionales[tipoInfraestructura] || [])]
      }
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en solicitarInfraestructura:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar solicitud',
      detalles: [error.message]
    });
  }
}

/**
 * CATEGORÍA 4: AUTOMATIZACIÓN/PIPELINE
 * POST /api/solicitudes/automatizacion
 * 
 * Body: {
 *   nombrePipeline: "deploy-staging-nightly",
 *   tipo: "jenkins-pipeline",
 *   descripcion: "Despliegue automático a staging cada noche",
 *   triggers: ["schedule", "webhook"],
 *   etapas: ["build", "test", "deploy", "smoke-tests"],
 *   documentacion: "https://wiki.bancobase.com/...",
 *   email_solicitante: "devops@bancobase.com"
 * }
 */
async function solicitarAutomatizacion(req, res) {
  try {
    const {
      nombrePipeline,
      tipo,
      descripcion,
      triggers,
      etapas,
      documentacion,
      email_solicitante
    } = req.body;

    // Validar
    const validacion = validarAutomatizacion({
      nombrePipeline,
      tipo,
      descripcion,
      email_solicitante
    });

    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: validacion.errores
      });
    }

    // Generar ID
    const idSolicitud = generarIdSolicitud();

    // Construir detalles
    const detalles = construirDetallesAutomatizacion({
      nombrePipeline,
      tipo,
      descripcion,
      triggers,
      etapas,
      documentacion,
      email_solicitante
    });

    // Labels dinámicos según tipo
    const labelsAdicionales = {
      'workflow-github': ['github', 'actions'],
      'jenkins-pipeline': ['jenkins', 'groovy'],
      'automation-script': ['automation', 'scripting'],
      'webhook': ['webhook', 'integration']
    };

    // Procesar
    const resultado = await procesarSolicitudGenerica(
      detalles,
      idSolicitud,
      {
        categoria: 'automatización',
        titulo: `Nuevo Pipeline: ${nombrePipeline}`,
        detalles,
        jiraLabels: ['automatizacion', 'pipeline', ...(labelsAdicionales[tipo] || [])]
      }
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en solicitarAutomatizacion:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar solicitud',
      detalles: [error.message]
    });
  }
}

module.exports = {
  solicitarNuevaHerramienta,
  solicitarContenedor,
  solicitarInfraestructura,
  solicitarAutomatizacion
};
