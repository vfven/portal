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
 * Genera contenido Terraform para VM Cloud.
 * Soporta AWS, Azure y GCP.
 */
function generarTerraform(datos) {
  const { proveedor, region, tipo_instancia: tipo, tamano_disco: tamano = '50' } = datos;
  const nombre = String(datos.nombre_vm).replace(/[^a-z0-9-]/gi, '').toLowerCase();

  let tf = `# Terraform config para ${proveedor}\nprovider "${proveedor.toLowerCase()}" { region = "${region}" }\n`;

  if (proveedor === 'AWS') {
    tf += `resource "aws_instance" "${nombre}" {\n  ami           = "ami-0c55b159cbfafe1f0"\n  instance_type = "${tipo}"\n  root_block_device { volume_size = ${tamano} }\n  tags = { Name = "${nombre}" }\n}\n`;
  } else if (proveedor === 'Azure') {
    tf += `resource "azurerm_linux_virtual_machine" "${nombre}" {\n  name     = "${nombre}"\n  location = "${region}"\n  size     = "${tipo}"\n  admin_username = "azureuser"\n  admin_ssh_key { username = "azureuser"; public_key = file("~/.ssh/id_rsa.pub") }\n  os_disk { disk_size_gb = ${tamano} }\n  source_image_reference { publisher = "Canonical"; offer = "UbuntuServer"; sku = "22.04-LTS"; version = "latest" }\n}\n`;
  } else if (proveedor === 'GCP') {
    tf += `resource "google_compute_instance" "${nombre}" {\n  name         = "${nombre}"\n  machine_type = "${tipo}"\n  zone         = "${region}-a"\n  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts"; size = ${tamano} } }\n  network_interface { network = "default"; access_config {} }\n}\n`;
  }
  return tf;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SOLICITUD SIMPLE / GENÉRICA
 * Para: accesos, namespaces, secretos, o cualquier solicitud sin especificación.
 * 
 * Campos esperados:
 * - nombreServicio: nombre del servicio o acción solicitada
 * - email_solicitante: correo del que solicita
 * - descripcion: qué se necesita
 * - (opcional) campos adicionales dinámicos
 */
exports.procesarSolicitudSimple = async (req, res) => {
  try {
    const datos = req.body;
    const idSolicitud = generarId();

    // Validaciones mínimas
    if (!datos.nombreServicio || !datos.email_solicitante) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de servicio y email son requeridos',
      });
    }

    // Enviar correos
    await enviarCorreoEquipo(datos, idSolicitud);
    await enviarCorreoSolicitante(datos, idSolicitud);

    // Crear ticket en Jira
    const jiraTicketKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Solicitud General',
      labels: ['autoservicio', 'general'],
    });

    return res.status(200).json({
      success: true,
      mensaje: 'Solicitud enviada correctamente',
      id: idSolicitud,
      jiraTicket: jiraTicketKey,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * SOLICITUD VM CLOUD
 * Para aprovisionamiento de máquinas virtuales en AWS, Azure o GCP.
 * 
 * Campos esperados:
 * - nombreServicio: "Solicitud VM Cloud"
 * - nombre_vm: nombre de la instancia
 * - proveedor: AWS, Azure o GCP
 * - region: región del proveedor
 * - tipo_instancia: tamaño (ej: t3.medium, Standard_B2s, n1-standard-1)
 * - tamano_disco: tamaño del disco en GB (default: 50)
 * - email_solicitante: correo del solicitante
 * - (opcional) descripcion, ambiente, etc
 */
exports.procesarSolicitudVMCloud = async (req, res) => {
  try {
    const datos = req.body;
    const idSolicitud = generarId();

    // Validaciones específicas para VM Cloud
    if (!datos.nombre_vm || !datos.proveedor || !datos.region || !datos.tipo_instancia) {
      return res.status(400).json({
        success: false,
        error: 'Nombre VM, proveedor, región y tipo de instancia son requeridos',
      });
    }

    if (!['AWS', 'Azure', 'GCP'].includes(datos.proveedor)) {
      return res.status(400).json({
        success: false,
        error: 'Proveedor debe ser AWS, Azure o GCP',
      });
    }

    // Generar contenido Terraform
    const tfContent = generarTerraform(datos);

    // Sección adjunto con estilos inline
    const seccionAdjuntos = `
      <div style="background:#e6f4ea;border-left:4px solid #1e7b48;padding:12px 16px;border-radius:6px;margin:16px 0;font-size:13px;color:#1e7b48;">
        📎 <strong>Archivo Terraform adjunto:</strong> main.tf
      </div>
      <div style="background:#1e2a3a;color:#e2e8f0;padding:16px;border-radius:8px;font-family:monospace;font-size:12px;overflow-x:auto;margin:8px 0;">
        ${escapeHtml(tfContent.substring(0, 1000))}${tfContent.length > 1000 ? '\n... (archivo completo adjunto)' : ''}
      </div>`;

    // Enviar correo al equipo CON el bloque Terraform
    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[VM Cloud] ${datos.nombre_vm} en ${datos.proveedor} - ${idSolicitud}`,
      seccionAdjuntos,
    });

    // Enviar confirmación al solicitante (SIN el bloque Terraform)
    await enviarCorreoSolicitante(datos, idSolicitud);

    // Crear ticket en Jira
    const jiraTicketKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Solicitud VM Cloud',
      labels: ['autoservicio', 'vm-cloud', datos.proveedor.toLowerCase()],
    });

    return res.status(200).json({
      success: true,
      mensaje: 'Solicitud de VM Cloud enviada con Terraform',
      id: idSolicitud,
      jiraTicket: jiraTicketKey,
      terraformPreview: tfContent,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * SOLICITUD DE ACCESO A KUBERNETES NAMESPACE
 * Para provisioning automático de namespace con RBAC y limitaciones.
 * 
 * Campos esperados:
 * - nombreServicio: "Namespace Kubernetes"
 * - nombre_namespace: nombre del namespace
 * - ambiente: dev, qa, stg, prod
 * - email_solicitante: correo del solicitante
 * - cpu_limite: límite de CPU (ej: "500m")
 * - memoria_limite: límite de memoria (ej: "512Mi")
 */
exports.procesarSolicitudNamespaceK8s = async (req, res) => {
  try {
    const datos = req.body;
    const idSolicitud = generarId();

    if (!datos.nombre_namespace || !datos.ambiente) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de namespace y ambiente son requeridos',
      });
    }

    // Generar manifiesto Kubernetes básico
    const manifestoK8s = `apiVersion: v1
kind: Namespace
metadata:
  name: ${datos.nombre_namespace}
  labels:
    environment: ${datos.ambiente}
    managed-by: portal-autoservicio
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ${datos.nombre_namespace}-quota
  namespace: ${datos.nombre_namespace}
spec:
  hard:
    cpu: "${datos.cpu_limite || '1000m'}"
    memory: "${datos.memoria_limite || '1Gi'}"
    pods: "100"
    persistentvolumeclaims: "5"`;

    const seccionAdjuntos = `
      <div style="background:#E6F0FA;border-left:4px solid #0052A5;border-radius:6px;padding:12px 16px;margin:16px 0;font-size:13px;color:#0052A5;">
        📦 <strong>Namespace:</strong> ${escapeHtml(datos.nombre_namespace)}<br>
        🌍 <strong>Ambiente:</strong> ${escapeHtml(datos.ambiente)}<br>
        💾 <strong>CPU Límite:</strong> ${escapeHtml(datos.cpu_limite || '1000m')}<br>
        🧠 <strong>Memoria Límite:</strong> ${escapeHtml(datos.memoria_limite || '1Gi')}
      </div>
      <div style="background:#1e2a3a;color:#e2e8f0;padding:16px;border-radius:8px;font-family:monospace;font-size:12px;overflow-x:auto;margin:8px 0;">
        ${escapeHtml(manifestoK8s)}
      </div>`;

    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[K8s Namespace] ${datos.nombre_namespace} en ${datos.ambiente} - ${idSolicitud}`,
      seccionAdjuntos,
    });
    await enviarCorreoSolicitante(datos, idSolicitud);

    const jiraTicketKey = await crearTicketJira(datos, idSolicitud, {
      tipoIssue: 'Namespace Kubernetes',
      labels: ['autoservicio', 'kubernetes', datos.ambiente],
    });

    return res.status(200).json({
      success: true,
      mensaje: 'Solicitud de namespace Kubernetes enviada',
      id: idSolicitud,
      jiraTicket: jiraTicketKey,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
