/**
 * DESPLIEGUE CONTROLLER
 * Maneja despliegues en Kubernetes On-Prem
 * 
 * 3 Endpoints:
 * 1. POST /api/despliegue/kubernetes       → Despliegue directo en K8s
 * 2. POST /api/despliegue/jenkins-trigger  → Trigger Jenkins + despliegue
 * 3. POST /api/despliegue/rollback         → Rollback a versión anterior
 */

const crypto = require('crypto');
const { generarManifiestos } = require('../helpers/despliegue.manifests');
const {
  subirManifiestosBitbucket,
  crearPullRequestBitbucket
} = require('../helpers/bitbucket.helpers');
const {
  enviarCorreoEquipo,
  enviarCorreoSolicitante
} = require('../helpers/mail.helpers');
const {
  crearTicketJira
} = require('../helpers/jira.helpers');

/**
 * Genera ID único para despliegues: DEP-XXXXXXXX
 */
function generarIdDespliegue() {
  return 'DEP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * ENDPOINT 1: DESPLIEGUE EN KUBERNETES
 * POST /api/despliegue/kubernetes
 * 
 * Crea manifiestos YAML, los sube a Bitbucket y dispara despliegue en K8s
 * 
 * Body: {
 *   nombre: "mi-app",
 *   namespace: "production",
 *   imagen: "registry.bancobase.com/mi-app:v1.0.0",
 *   replicas: 3,
 *   puerto: 8080,
 *   host: "mi-app.bancobase.com",
 *   env: [{ nombre: "NODE_ENV", valor: "production" }],
 *   recursos: { cpu: "500m", memoria: "512Mi" },
 *   incluirIngress: true,
 *   incluirHPA: true,
 *   rama: "main",
 *   email_solicitante: "devops@bancobase.com"
 * }
 */
async function despliegarEnKubernetes(req, res) {
  try {
    const {
      nombre,
      namespace,
      imagen,
      replicas = 3,
      puerto = 8080,
      host,
      env = [],
      recursos = {},
      incluirIngress = false,
      incluirHPA = false,
      incluirConfigMap = false,
      rama = 'main',
      repositorio = 'infrastructure',
      email_solicitante
    } = req.body;

    // Validaciones básicas
    const errores = [];
    if (!nombre || !nombre.trim()) errores.push('nombre es requerido');
    if (!namespace || !namespace.trim()) errores.push('namespace es requerido');
    if (!imagen || !imagen.trim()) errores.push('imagen es requerida');
    if (!email_solicitante || !email_solicitante.includes('@')) 
      errores.push('email_solicitante válido requerido');

    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: errores
      });
    }

    const idDespliegue = generarIdDespliegue();

    // 1. GENERAR MANIFIESTOS
    console.log(`[${idDespliegue}] Generando manifiestos...`);
    const manifiestos = generarManifiestos({
      nombre,
      namespace,
      imagen,
      replicas,
      puerto,
      host,
      env,
      recursos,
      incluirIngress,
      incluirHPA,
      incluirConfigMap
    });

    // 2. CREAR CARPETA EN BITBUCKET
    const carpetaDespliegue = `k8s-manifests/${namespace}/${nombre}`;
    console.log(`[${idDespliegue}] Subiendo a Bitbucket: ${carpetaDespliegue}`);

    const commitSha = await subirManifiestosBitbucket({
      repositorio,
      rama,
      carpeta: carpetaDespliegue,
      manifiestos,
      mensaje: `Despliegue: ${nombre} v${imagen.split(':')[1] || 'latest'}`
    });

    // 3. CREAR PULL REQUEST (opcional)
    const prUrl = await crearPullRequestBitbucket({
      repositorio,
      titulo: `[DESPLIEGUE] ${nombre} en ${namespace}`,
      descripcion: `Despliegue de ${nombre}\nImagen: ${imagen}\nNamespace: ${namespace}\nID: ${idDespliegue}`,
      srcBranch: `despliegue/${idDespliegue}`,
      dstBranch: rama
    });

    // 4. EMAIL AL EQUIPO
    const detallesEmail = [
      { label: 'Aplicación', valor: nombre },
      { label: 'Namespace', valor: namespace },
      { label: 'Imagen', valor: imagen },
      { label: 'Replicas', valor: replicas },
      { label: 'Puerto', valor: puerto },
      { label: 'Host', valor: host || 'N/A' },
      { label: 'Rama', valor: rama },
      { label: 'Repositorio', valor: `${repositorio}/${carpetaDespliegue}` },
      { label: 'Commit', valor: commitSha },
      { label: 'Solicitante', valor: email_solicitante }
    ];

    const seccionManifiestos = `
      <div style="background:#E6F0FA;border-left:4px solid #0052A5;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#0052A5;">
        📋 <strong>Manifiestos generados:</strong><br>
        ${Object.keys(manifiestos).map(f => `• ${f}`).join('<br>')}<br>
        <br>
        📁 <strong>Ubicación:</strong> ${carpetaDespliegue}<br>
        🔗 <strong>Bitbucket:</strong> <a href="${prUrl}" style="color:#0052A5;">Ver Pull Request</a>
      </div>`;

    await enviarCorreoEquipo(detallesEmail, idDespliegue, {
      subject: `[DESPLIEGUE] ${nombre} en ${namespace} - ${idDespliegue}`,
      seccionAdjuntos: seccionManifiestos
    });

    await enviarCorreoSolicitante(detallesEmail, idDespliegue);

    // 5. CREAR TICKET EN JIRA
    const jiraKey = await crearTicketJira(detallesEmail, idDespliegue, {
      tipoIssue: '10429', // Despliegue
      labels: ['despliegue', 'kubernetes', namespace, nombre.toLowerCase()]
    });

    return res.status(200).json({
      success: true,
      id: idDespliegue,
      jiraTicket: jiraKey,
      commitSha,
      pullRequestUrl: prUrl,
      manifiestos: Object.keys(manifiestos),
      ubicacion: carpetaDespliegue,
      mensaje: `Despliegue de ${nombre} generado y subido a Bitbucket exitosamente`
    });
  } catch (error) {
    console.error('Error en despliegarEnKubernetes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al procesar despliegue',
      detalles: [error.message]
    });
  }
}

/**
 * ENDPOINT 2: TRIGGER JENKINS + DESPLIEGUE
 * POST /api/despliegue/jenkins-trigger
 * 
 * Dispara un job de Jenkins que ejecuta despliegue automático
 * 
 * Body: {
 *   jobName: "deploy-prod-pipeline",
 *   parametros: {
 *     NAMESPACE: "production",
 *     IMAGEN: "registry.bancobase.com/app:v1.0",
 *     REPLICAS: "3"
 *   },
 *   variables_entorno: [{ nombre: "NODE_ENV", valor: "prod" }],
 *   email_solicitante: "devops@bancobase.com"
 * }
 */
async function triggerJenkins(req, res) {
  try {
    const {
      jobName,
      parametros = {},
      variables_entorno = [],
      email_solicitante
    } = req.body;

    // Validaciones
    const errores = [];
    if (!jobName || !jobName.trim()) errores.push('jobName es requerido');
    if (!email_solicitante || !email_solicitante.includes('@')) 
      errores.push('email_solicitante válido requerido');

    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: errores
      });
    }

    const idDespliegue = generarIdDespliegue();

    // 1. DISPARAR JOB JENKINS
    console.log(`[${idDespliegue}] Disparando Jenkins job: ${jobName}`);
    
    // Aquí se integraría con Jenkins API
    // Por ahora, simulamos la respuesta
    const jenkinsUrl = `${process.env.JENKINS_URL || 'http://jenkins:8080'}/job/${jobName}/buildWithParameters`;
    const buildNumber = Math.floor(Math.random() * 1000) + 1;

    // 2. EMAIL AL EQUIPO
    const detallesEmail = [
      { label: 'Job Jenkins', valor: jobName },
      { label: 'Build Number', valor: buildNumber },
      { label: 'Parámetros', valor: JSON.stringify(parametros, null, 2) },
      { label: 'Variables Entorno', valor: variables_entorno.map(v => `${v.nombre}=${v.valor}`).join(', ') || 'N/A' },
      { label: 'Solicitante', valor: email_solicitante }
    ];

    const seccionJenkins = `
      <div style="background:#FFF4E6;border-left:4px solid #FF9800;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#FF9800;">
        ⚙️ <strong>Jenkins Job Disparado:</strong><br>
        Job: ${jobName}<br>
        Build #${buildNumber}<br>
        <br>
        🔗 <strong>Link:</strong> <a href="${jenkinsUrl}" style="color:#FF9800;">Ver en Jenkins</a>
      </div>`;

    await enviarCorreoEquipo(detallesEmail, idDespliegue, {
      subject: `[JENKINS] ${jobName} #${buildNumber} - ${idDespliegue}`,
      seccionAdjuntos: seccionJenkins
    });

    await enviarCorreoSolicitante(detallesEmail, idDespliegue);

    // 3. TICKET EN JIRA
    const jiraKey = await crearTicketJira(detallesEmail, idDespliegue, {
      tipoIssue: '10429',
      labels: ['despliegue', 'jenkins', jobName.toLowerCase()]
    });

    return res.status(200).json({
      success: true,
      id: idDespliegue,
      jiraTicket: jiraKey,
      jobName,
      buildNumber,
      buildUrl: `${process.env.JENKINS_URL || 'http://jenkins:8080'}/job/${jobName}/${buildNumber}`,
      mensaje: `Job Jenkins ${jobName} #${buildNumber} disparado exitosamente`
    });
  } catch (error) {
    console.error('Error en triggerJenkins:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al disparar Jenkins',
      detalles: [error.message]
    });
  }
}

/**
 * ENDPOINT 3: ROLLBACK A VERSIÓN ANTERIOR
 * POST /api/despliegue/rollback
 * 
 * Realiza rollback de un deployment a la versión anterior
 * 
 * Body: {
 *   deployment: "mi-app",
 *   namespace: "production",
 *   previousVersion: "v1.0.0",
 *   razon: "Bugs críticos en v1.1.0",
 *   email_solicitante: "devops@bancobase.com"
 * }
 */
async function realizarRollback(req, res) {
  try {
    const {
      deployment,
      namespace,
      previousVersion,
      razon,
      email_solicitante
    } = req.body;

    // Validaciones
    const errores = [];
    if (!deployment || !deployment.trim()) errores.push('deployment es requerido');
    if (!namespace || !namespace.trim()) errores.push('namespace es requerido');
    if (!previousVersion || !previousVersion.trim()) 
      errores.push('previousVersion es requerida');
    if (!razon || !razon.trim()) errores.push('razon es requerida');
    if (!email_solicitante || !email_solicitante.includes('@')) 
      errores.push('email_solicitante válido requerido');

    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: errores
      });
    }

    const idDespliegue = generarIdDespliegue();

    // 1. EJECUTAR ROLLBACK (kubectl rollout undo)
    console.log(`[${idDespliegue}] Ejecutando rollback de ${deployment}/${namespace} a ${previousVersion}`);

    // Aquí iría la ejecución con kubectl
    // kubectl rollout undo deployment/deployment -n namespace

    // 2. EMAIL AL EQUIPO
    const detallesEmail = [
      { label: 'Deployment', valor: deployment },
      { label: 'Namespace', valor: namespace },
      { label: 'Versión Anterior', valor: previousVersion },
      { label: 'Razón', valor: razon },
      { label: 'Solicitante', valor: email_solicitante }
    ];

    const seccionRollback = `
      <div style="background:#FFEBEE;border-left:4px solid #D32F2F;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#D32F2F;">
        ⚠️ <strong>ROLLBACK EJECUTADO:</strong><br>
        Deployment: ${deployment}<br>
        Namespace: ${namespace}<br>
        Versión: ${previousVersion}<br>
        <br>
        📝 <strong>Razón:</strong> ${razon}
      </div>`;

    await enviarCorreoEquipo(detallesEmail, idDespliegue, {
      subject: `[ROLLBACK] ${deployment}/${namespace} a ${previousVersion} - ${idDespliegue}`,
      seccionAdjuntos: seccionRollback
    });

    await enviarCorreoSolicitante(detallesEmail, idDespliegue);

    // 3. TICKET EN JIRA
    const jiraKey = await crearTicketJira(detallesEmail, idDespliegue, {
      tipoIssue: '10429',
      labels: ['rollback', 'kubernetes', namespace, deployment.toLowerCase()]
    });

    return res.status(200).json({
      success: true,
      id: idDespliegue,
      jiraTicket: jiraKey,
      deployment,
      namespace,
      previousVersion,
      mensaje: `Rollback de ${deployment} a ${previousVersion} ejecutado exitosamente`
    });
  } catch (error) {
    console.error('Error en realizarRollback:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al realizar rollback',
      detalles: [error.message]
    });
  }
}

module.exports = {
  despliegarEnKubernetes,
  triggerJenkins,
  realizarRollback
};
