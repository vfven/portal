const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const config = require('./config');

// ═══════════════════════════════════════════════════
// CONFIGURACIÓN SMTP
// ═══════════════════════════════════════════════════
const isMailConfigured = config.SMTP_HOST && config.SMTP_USER;

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: parseInt(config.SMTP_PORT),
  secure: config.SMTP_PORT == 465,
  auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  tls: { rejectUnauthorized: false }
});

// ═══════════════════════════════════════════════════
// PLANTILLA BASE HTML (inline styles para compatibilidad con Outlook/Gmail)
// ═══════════════════════════════════════════════════
const PLANTILLA_CORREO = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Inter',Arial,sans-serif;background-color:#f4f7fc;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

  <!-- HEADER -->
  <div style="background:#002B5C;padding:28px 24px;text-align:center;">
    <div style="display:inline-block;background:rgba(249,168,0,0.2);border:1px solid rgba(249,168,0,0.4);border-radius:20px;padding:4px 14px;margin-bottom:12px;">
      <span style="color:#F9A800;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Portal de Autoservicio</span>
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">[[TITULO]]</h1>
    <p style="margin:0;color:rgba(255,255,255,0.75);font-size:13px;">Banco BASE · Plataforma de Ingeniería</p>
  </div>

  <!-- CONTENT -->
  <div style="padding:28px 24px;">
    <p style="margin:0 0 8px;font-size:14px;color:#455A64;">[[SALUDO]]</p>
    <p style="margin:0 0 20px;font-size:14px;color:#455A64;">[[INTRO]]</p>
    [[TABLA_DETALLES]]
    [[SECCION_ADJUNTOS]]
    <p style="margin:20px 0 0;font-size:14px;color:#455A64;">Saludos cordiales,<br><strong style="color:#002B5C;">Plataforma DevOps · Banco BASE</strong></p>
  </div>

  <!-- FOOTER -->
  <div style="background:#eef2f5;padding:16px 24px;text-align:center;border-top:1px solid #dce3e9;">
    <p style="margin:0;font-size:12px;color:#6c7a89;">Este mensaje es generado automáticamente. Por favor no responder directamente.<br>
    Consultas al equipo: <a href="mailto:devops@bancobase.com" style="color:#002B5C;font-weight:600;">devops@bancobase.com</a></p>
  </div>

</div>
</body>
</html>`;

// ═══════════════════════════════════════════════════
// HELPERS COMPARTIDOS
// ═══════════════════════════════════════════════════

function generarId() {
  return 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\n\r]/g, '<br>');
}

/**
 * Construye una tabla HTML con estilos inline a partir de un objeto de datos.
 * Excluye los campos de la lista `excluir`.
 */
function construirTablaHtml(datos, idSolicitud, excluir = ['nombreServicio', 'email_solicitante', 'fecha']) {
  const fijasFijas = [
    { label: 'Servicio',     valor: datos.nombreServicio },
    { label: 'Nº Solicitud', valor: idSolicitud, badge: true },
    { label: 'Solicitante',  valor: datos.email_solicitante || 'No especificado' },
    { label: 'Fecha',        valor: datos.fecha || new Date().toLocaleString('es-MX') },
  ];

  const filaFija = ({ label, valor, badge }, bg) => `
    <tr style="background:${bg};">
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#002B5C;font-weight:600;width:35%;">${label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#1E2A3A;">
        ${badge
          ? `<strong style="background:#E8EEF5;color:#002B5C;padding:3px 8px;border-radius:4px;font-size:12px;">${escapeHtml(valor)}</strong>`
          : escapeHtml(valor)
        }
      </td>
    </tr>`;

  let html = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
      <tr>
        <th style="background:#002B5C;color:#ffffff;padding:10px 14px;text-align:left;font-weight:600;">Campo</th>
        <th style="background:#002B5C;color:#ffffff;padding:10px 14px;text-align:left;font-weight:600;">Valor</th>
      </tr>
      ${fijasFijas.map((f, i) => filaFija(f, i % 2 === 0 ? '#f8f9fb' : '#ffffff')).join('')}`;

  // Campos adicionales dinámicos
  let rowIndex = fijasFijas.length;
  for (let [k, v] of Object.entries(datos)) {
    if (!excluir.includes(k) && v) {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const bg = rowIndex % 2 === 0 ? '#f8f9fb' : '#ffffff';
      html += `
        <tr style="background:${bg};">
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#002B5C;font-weight:600;">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#1E2A3A;">${escapeHtml(v)}</td>
        </tr>`;
      rowIndex++;
    }
  }

  html += `</table>`;
  return html;
}

/**
 * Renderiza la plantilla base con los placeholders reemplazados.
 */
function renderPlantilla({ titulo, saludo, intro, tablaHtml, seccionAdjuntos = '' }) {
  return PLANTILLA_CORREO
    .replace('[[TITULO]]',          titulo        || 'Solicitud DevOps')
    .replace('[[SALUDO]]',          saludo        || 'Estimado equipo,')
    .replace('[[INTRO]]',           intro         || '')
    .replace('[[TABLA_DETALLES]]',  tablaHtml     || '')
    .replace('[[SECCION_ADJUNTOS]]', seccionAdjuntos);
}

/**
 * Envía el correo al equipo DevOps.
 */
async function enviarCorreoEquipo(datos, idSolicitud, { subject, seccionAdjuntos = '' } = {}) {
  if (!isMailConfigured) {
    console.log('⚠️ SMTP no configurado. No se enviará correo al equipo.');
    return;
  }
  try {
    const tablaHtml = construirTablaHtml(datos, idSolicitud);
    const html = renderPlantilla({
      titulo: 'Solicitud de Autoservicio DevOps',
      saludo: 'Estimado equipo,',
      intro:  'Se ha recibido una nueva solicitud desde el <strong style="color:#002B5C;">Portal de Autoservicio</strong>. A continuación los detalles:',
      tablaHtml,
      seccionAdjuntos,
    });
    await transporter.sendMail({
      from:    config.SMTP_USER || '"Portal DevOps" <no-reply@bancobase.com>',
      to:      config.CORREO_DESTINO,
      subject: subject || `[Autoservicio] ${datos.nombreServicio} - ${idSolicitud}`,
      html,
    });
    console.log(`✅ Correo enviado al equipo para ${idSolicitud}`);
  } catch (err) {
    console.error(`❌ No se pudo enviar correo al equipo: ${err.message}`);
  }
}

/**
 * Envía el correo de confirmación al solicitante.
 */
async function enviarCorreoSolicitante(datos, idSolicitud) {
  if (!datos.email_solicitante) return;
  if (!isMailConfigured) {
    console.log('⚠️ SMTP no configurado. No se enviará copia al solicitante.');
    return;
  }
  try {
    const tablaHtml = `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <tr>
          <th style="background:#002B5C;color:#ffffff;padding:10px 14px;text-align:left;font-weight:600;">Campo</th>
          <th style="background:#002B5C;color:#ffffff;padding:10px 14px;text-align:left;font-weight:600;">Valor</th>
        </tr>
        <tr style="background:#f8f9fb;">
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#002B5C;font-weight:600;">Nº Solicitud</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">
            <strong style="background:#E8EEF5;color:#002B5C;padding:3px 8px;border-radius:4px;font-size:12px;">${idSolicitud}</strong>
          </td>
        </tr>
        <tr style="background:#ffffff;">
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#002B5C;font-weight:600;">Servicio solicitado</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#1E2A3A;">${escapeHtml(datos.nombreServicio)}</td>
        </tr>
        <tr style="background:#f8f9fb;">
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#002B5C;font-weight:600;">Estado</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">
            <span style="background:#E6F4EA;color:#1E7B48;font-weight:600;padding:4px 10px;border-radius:20px;font-size:12px;">✅ Recibida</span>
          </td>
        </tr>
        <tr style="background:#ffffff;">
          <td style="padding:10px 14px;color:#002B5C;font-weight:600;">Tiempo estimado</td>
          <td style="padding:10px 14px;color:#1E2A3A;">2 horas hábiles</td>
        </tr>
      </table>
      <div style="background:#E6F0FA;border-left:4px solid #0052A5;border-radius:6px;padding:14px 16px;margin:16px 0;font-size:13px;color:#0052A5;">
        El equipo DevOps revisará tu solicitud y se pondrá en contacto contigo a la brevedad.
        Para seguimiento, usa el número: <strong>${idSolicitud}</strong>
      </div>`;

    const html = renderPlantilla({
      titulo: 'Confirmación de Solicitud',
      saludo: `Hola,`,
      intro:  `Tu solicitud ha sido recibida exitosamente. A continuación el resumen:`,
      tablaHtml,
    });

    await transporter.sendMail({
      from:    config.SMTP_USER || '"Portal DevOps" <no-reply@bancobase.com>',
      to:      datos.email_solicitante,
      subject: `✅ Confirmación: ${datos.nombreServicio} (${idSolicitud})`,
      html,
    });
    console.log(`✅ Confirmación enviada a ${datos.email_solicitante}`);
  } catch (err) {
    console.error(`❌ No se pudo enviar correo al solicitante: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════
// JIRA
// ═══════════════════════════════════════════════════
async function crearTicketJiraAutoservicio(datos, idSolicitud) {
  if (!config.JIRA_API_TOKEN || config.JIRA_API_TOKEN === 'tu_api_token') {
    console.log('⚠️ JIRA_API_TOKEN no configurado. Saltando creación de ticket.');
    return null;
  }

  const solicitante = datos.email_solicitante || 'anonimo@bancobase.com';
  const resumen = `[AUTOSERVICIO] ${datos.nombreServicio} - ${idSolicitud}`;

  let filasTabla = [
    ['Servicio',    datos.nombreServicio],
    ['Nº Solicitud', idSolicitud],
    ['Solicitante', solicitante],
    ['Fecha',       datos.fecha || new Date().toLocaleString()],
  ];

  for (let [k, v] of Object.entries(datos)) {
    if (!['nombreServicio', 'email_solicitante', 'fecha'].includes(k) && v) {
      filasTabla.push([k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), String(v)]);
    }
  }

  const adfDescription = {
    type: 'doc', version: 1,
    content: [
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Solicitud de Autoservicio DevOps' }] },
      {
        type: 'table',
        attrs: { isNumberColumnEnabled: false, layout: 'default' },
        content: filasTabla.map(fila => ({
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: fila[0] }] }] },
            { type: 'tableCell',   content: [{ type: 'paragraph', content: [{ type: 'text', text: fila[1] }] }] },
          ],
        })),
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'Ticket generado automáticamente desde el Portal de Autoservicio.' }] },
    ],
  };

  const ticketData = {
    fields: {
      project:     { key: config.JIRA_PROJECT_KEY },
      issuetype:   { id: config.JIRA_TYPE_SOLICITUD },
      summary:     resumen,
      description: adfDescription,
      labels:      ['autoservicio', datos.nombreServicio.toLowerCase().replace(/\s/g, '-')],
    },
  };

  const authBuffer = Buffer.from(`${config.JIRA_USER_EMAIL}:${config.JIRA_API_TOKEN}`).toString('base64');

  try {
    const response = await axios.post(`${config.JIRA_DOMAIN}/rest/api/3/issue`, ticketData, {
      headers: {
        'Authorization': `Basic ${authBuffer}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
    });
    return response.data.key;
  } catch (error) {
    console.error(`❌ Error Jira API: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════
// TERRAFORM (solo para VM Cloud)
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// CONTROLLERS
// ═══════════════════════════════════════════════════

/**
 * Solicitud genérica / simple (accesos, namespaces, secretos, etc.)
 */
exports.procesarSolicitudSimple = async (req, res) => {
  try {
    const datos = req.body;
    const idSolicitud = generarId();

    // Correos — ambos usan las funciones compartidas
    await enviarCorreoEquipo(datos, idSolicitud);
    await enviarCorreoSolicitante(datos, idSolicitud);

    // Jira
    const jiraTicketKey = await crearTicketJiraAutoservicio(datos, idSolicitud);

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
 * Solicitud de VM en Cloud — incluye adjunto Terraform
 */
exports.procesarSolicitudVMCloud = async (req, res) => {
  try {
    const datos = req.body;
    const idSolicitud = generarId();
    const tfContent = generarTerraform(datos);

    // Sección adjunto con estilos inline
    const seccionAdjuntos = `
      <div style="background:#e6f4ea;border-left:4px solid #1e7b48;padding:12px 16px;border-radius:6px;margin:16px 0;font-size:13px;color:#1e7b48;">
        📎 <strong>Archivo adjunto:</strong> main.tf
      </div>
      <div style="background:#1e2a3a;color:#e2e8f0;padding:16px;border-radius:8px;font-family:monospace;font-size:12px;overflow-x:auto;margin:8px 0;">
        ${escapeHtml(tfContent.substring(0, 1000))}${tfContent.length > 1000 ? '\n... (archivo completo adjunto)' : ''}
      </div>`;

    // Correo al equipo con el bloque Terraform
    await enviarCorreoEquipo(datos, idSolicitud, {
      subject: `[Autoservicio VM] ${datos.nombreServicio} - ${idSolicitud}`,
      seccionAdjuntos,
    });

    // Confirmación al solicitante (sin el bloque Terraform)
    await enviarCorreoSolicitante(datos, idSolicitud);

    // Jira
    const jiraTicketKey = await crearTicketJiraAutoservicio(datos, idSolicitud);

    return res.status(200).json({
      success: true,
      mensaje: 'Solicitud enviada con Terraform',
      id: idSolicitud,
      jiraTicket: jiraTicketKey,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
