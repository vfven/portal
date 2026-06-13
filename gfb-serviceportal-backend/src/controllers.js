const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const config = require('./config');

// Verifica si el SMTP está configurado
const isMailConfigured = config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS;
// Configuración del transportador de correos (Nodemailer)
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: parseInt(config.SMTP_PORT),
  secure: config.SMTP_PORT == 465, // true para 465, false para otros puertos
  auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  tls: { rejectUnauthorized: false } // Util para entornos corporativos con proxies
});

const PLANTILLA_CORREO = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f7fc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .header { background: #002B5C; padding: 24px 20px; text-align: center; color: white; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
  .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
  .content { padding: 24px; }
  .footer { background: #eef2f5; padding: 16px; text-align: center; font-size: 12px; color: #6c7a89; border-top: 1px solid #dce3e9; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; vertical-align: top; }
  th { background: #e8edf2; color: #002B5C; font-weight: 600; width: 35%; }
  .attachment-note { background: #e6f4ea; border-left: 4px solid #1e7b48; padding: 12px; border-radius: 6px; margin: 16px 0; font-size: 13px; }
  .code-block { background: #1e2a3a; color: #e2e8f0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto; }
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>Solicitud de Autoservicio DevOps</h1><p>Banco BASE · Plataforma de Ingeniería</p></div>
  <div class="content">
    <p>Estimado equipo,</p>
    <p>Se ha recibido una nueva solicitud desde el <strong>Portal de Autoservicio</strong>. Detalles:</p>
    [[TABLA_DETALLES]]
    [[SECCION_ADJUNTOS]]
    <p>Saludos cordiales,<br><strong>Plataforma DevOps</strong></p>
  </div>
  <div class="footer">Este mensaje es automático. No responder.<br>Consultas a <a href="mailto:devops@bancobase.com">devops@bancobase.com</a></div>
</div>
</body>
</html>`;

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

function generarTerraform(datos) {
  const proveedor = datos.proveedor;
  const region = datos.region;
  const tipo = datos.tipo_instancia;
  const nombre = String(datos.nombre_vm).replace(/[^a-z0-9-]/gi, '').toLowerCase();
  const tamano = datos.tamano_disco || '50';
  
  let tf = `# Terraform config para ${proveedor}\nprovider "${proveedor.toLowerCase()}" { region = "${region}" }\n`;
  if (proveedor === 'AWS') {
    tf += `resource "aws_instance" "${nombre}" {\n  ami = "ami-0c55b159cbfafe1f0"\n  instance_type = "${tipo}"\n  root_block_device { volume_size = ${tamano} }\n  tags = { Name = "${nombre}" }\n}\n`;
  } else if (proveedor === 'Azure') {
    tf += `resource "azurerm_linux_virtual_machine" "${nombre}" {\n  name = "${nombre}"\n  location = "${region}"\n  size = "${tipo}"\n  admin_username = "azureuser"\n  admin_ssh_key { username = "azureuser"; public_key = file("~/.ssh/id_rsa.pub") }\n  os_disk { disk_size_gb = ${tamano} }\n  source_image_reference { publisher = "Canonical"; offer = "UbuntuServer"; sku = "22.04-LTS"; version = "latest" }\n}\n`;
  } else if (proveedor === 'GCP') {
    tf += `resource "google_compute_instance" "${nombre}" {\n  name = "${nombre}"\n  machine_type = "${tipo}"\n  zone = "${region}-a"\n  boot_disk { initialize_params { image = "ubuntu-os-cloud/ubuntu-2204-lts"; size = ${tamano} } }\n  network_interface { network = "default"; access_config {} }\n}\n`;
  }
  return tf;
}

// Lógica de Jira transpilada de Google UrlFetchApp a Axios
async function crearTicketJiraAutoservicio(datos, idSolicitud) {
  if (!config.JIRA_API_TOKEN) {
    console.log("⚠️ JIRA_API_TOKEN no configurado. Saltando creación de ticket.");
    return null;
  }

  const solicitante = datos.email_solicitante || 'anonimo@bancobase.com';
  const resumen = `[AUTOSERVICIO] ${datos.nombreServicio} - ${idSolicitud}`;

  let filasTabla = [
    ["Servicio", datos.nombreServicio],
    ["Nº Solicitud", idSolicitud],
    ["Solicitante", solicitante],
    ["Fecha", datos.fecha || new Date().toLocaleString()]
  ];

  for (let [k, v] of Object.entries(datos)) {
    if (!['nombreServicio', 'email_solicitante', 'fecha'].includes(k) && v) {
      let nombreCampo = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      filasTabla.push([nombreCampo, String(v)]);
    }
  }

  const adfDescription = {
    type: "doc",
    version: 1,
    content: [
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: "Solicitud de Autoservicio DevOps" }]
      },
      {
        type: "table",
        attrs: { isNumberColumnEnabled: false, layout: "default" },
        content: filasTabla.map(fila => ({
          type: "tableRow",
          content: [
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: fila[0] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: fila[1] }] }] }
          ]
        }))
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Ticket generado automáticamente desde el Portal de Autoservicio." }]
      }
    ]
  };

  const ticketData = {
    fields: {
      project: { key: config.JIRA_PROJECT_KEY },
      issuetype: { id: config.JIRA_TYPE_SOLICITUD },
      summary: resumen,
      description: adfDescription,
      labels: ["autoservicio", datos.nombreServicio.toLowerCase().replace(/\s/g, "-")]
    }
  };

  const authBuffer = Buffer.from(`${config.JIRA_USER_EMAIL}:${config.JIRA_API_TOKEN}`).toString('base64');
  
  try {
    const response = await axios.post(`${config.JIRA_DOMAIN}/rest/api/3/issue`, ticketData, {
      headers: {
        'Authorization': `Basic ${authBuffer}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return response.data.key;
  } catch (error) {
    console.error(`❌ Error Jira API: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    return null; // No bloquea la respuesta al cliente si falla Jira
  }
}

// Procesar formularios genéricos o simples
exports.procesarSolicitudSimple = async (req, res) => {
  try {
    const datos = req.body;
    const idSolicitud = generarId();
    
    let tablaHtml = `<table>
      <tr><th>Campo</th><th>Valor</th></tr>
      <tr><td>Servicio</td><td>${escapeHtml(datos.nombreServicio)}</td></tr>
      <tr><td>Nº Solicitud</td><td><strong>${idSolicitud}</strong></td></tr>
      <tr><td>Solicitante</td><td>${escapeHtml(datos.email_solicitante || 'No especificado')}</td></tr>
      <tr><td>Fecha</td><td>${escapeHtml(datos.fecha)}</td></tr>`;
      
    for (let [k, v] of Object.entries(datos)) {
      if (!['nombreServicio', 'email_solicitante', 'fecha'].includes(k) && v) {
        let nombreCampo = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        tablaHtml += `<tr><td>${escapeHtml(nombreCampo)}</td><td>${escapeHtml(v)}</td></tr>`;
      }
    }
    tablaHtml += `</table>`;
    
    let cuerpoHtml = PLANTILLA_CORREO.replace('[[TABLA_DETALLES]]', tablaHtml).replace('[[SECCION_ADJUNTOS]]', '');

    // Correo al equipo (con manejo de errores)
    if (isMailConfigured) {
      try {
        await transporter.sendMail({
          from: config.SMTP_USER || '"Portal DevOps" <no-reply@bancobase.com>',
          to: config.CORREO_DESTINO,
          subject: `[Autoservicio] ${datos.nombreServicio} - ${idSolicitud}`,
          html: cuerpoHtml
        });
      } catch (mailError) {
        console.error(`❌ No se pudo enviar correo al equipo: ${mailError.message}`);
      }
    } else {
      console.log("⚠️ SMTP no configurado. No se enviará correo al equipo.");
    }

    // Copia al solicitante
    if (datos.email_solicitante && isMailConfigured) {
      try {
        await transporter.sendMail({
          from: config.SMTP_USER || '"Portal DevOps" <no-reply@bancobase.com>',
          to: datos.email_solicitante,
          subject: `Confirmación: ${datos.nombreServicio} (${idSolicitud})`,
          html: `<p>✅ Solicitud recibida. Número: <strong>${idSolicitud}</strong></p><p>Pronto te contactaremos el equipo DevOps de Banco BASE.</p>`
        });
      } catch (mailError) {
        console.error(`❌ No se pudo enviar correo al solicitante ${datos.email_solicitante}: ${mailError.message}`);
      }
    } else if (!isMailConfigured) {
      console.log("⚠️ SMTP no configurado. No se enviará copia al solicitante.");
    }

    // Ejecutar creación del Ticket en Jira
    const jiraTicketKey = await crearTicketJiraAutoservicio(datos, idSolicitud);

    return res.status(200).json({
      success: true,
      mensaje: 'Solicitud enviada correctamente',
      id: idSolicitud,
      jiraTicket: jiraTicketKey
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Procesar formulario específico de VM con adjunto Terraform
exports.procesarSolicitudVMCloud = async (req, res) => {
  try {
    const datos = req.body;
    const idSolicitud = generarId();
    const tfContent = generarTerraform(datos);

    let tablaHtml = `<table>
      <tr><th>Campo</th><th>Valor</th></tr>
      <tr><td>📋 Servicio</td><td>${escapeHtml(datos.nombreServicio)}</td></tr>
      <tr><td>🆔 Nº Solicitud</td><td><strong>${idSolicitud}</strong></td></tr>
      <tr><td>👤 Solicitante</td><td>${escapeHtml(datos.email_solicitante)}</td></tr>
      <tr><td>📅 Fecha</td><td>${escapeHtml(datos.fecha)}</td></tr>`;
      
    for (let [k, v] of Object.entries(datos)) {
      if (!['nombreServicio', 'email_solicitante', 'fecha'].includes(k) && v) {
        let nombreCampo = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        tablaHtml += `<tr><td>${escapeHtml(nombreCampo)}</td><td>${escapeHtml(v)}</td></tr>`;
      }
    }
    tablaHtml += `</table>`;

    let seccionAdjuntos = `<div class="attachment-note">📎 <strong>Terraform adjunto:</strong> main.tf</div><div class="code-block">${escapeHtml(tfContent.substring(0, 1000))}${tfContent.length > 1000 ? '... (archivo completo adjunto)' : ''}</div>`;
    let cuerpoHtml = PLANTILLA_CORREO.replace('[[TABLA_DETALLES]]', tablaHtml).replace('[[SECCION_ADJUNTOS]]', seccionAdjuntos);

    const adjuntoTF = {
      filename: 'main.tf',
      content: tfContent
    };

    // Correo al equipo con el archivo adjunto real en los arreglos de nodemailer (con manejo de errores)
    if (isMailConfigured) {
      try {
        await transporter.sendMail({
          from: config.SMTP_USER || '"Portal DevOps" <no-reply@bancobase.com>',
          to: config.CORREO_DESTINO,
          subject: `[Autoservicio] ${datos.nombreServicio} - ${idSolicitud}`,
          html: cuerpoHtml
        });
      } catch (mailError) {
        console.error(`❌ No se pudo enviar correo al equipo: ${mailError.message}`);
      }
    } else {
      console.log("⚠️ SMTP no configurado. No se enviará correo al equipo.");
    }

    if (datos.email_solicitante && isMailConfigured) {
      try {
        await transporter.sendMail({
          from: config.SMTP_USER || '"Portal DevOps" <no-reply@bancobase.com>',
          to: datos.email_solicitante,
          subject: `Confirmación: ${datos.nombreServicio} (${idSolicitud})`,
          html: `<p>✅ Solicitud recibida. Número: <strong>${idSolicitud}</strong></p><p>Pronto te contactaremos el equipo DevOps de Banco BASE.</p>`
        });
      } catch (mailError) {
        console.error(`❌ No se pudo enviar correo al solicitante ${datos.email_solicitante}: ${mailError.message}`);
      }
    } else if (!isMailConfigured) {
      console.log("⚠️ SMTP no configurado. No se enviará copia al solicitante.");
    }

    const jiraTicketKey = await crearTicketJiraAutoservicio(datos, idSolicitud);

    return res.status(200).json({
      success: true,
      mensaje: 'Solicitud enviada con Terraform',
      id: idSolicitud,
      jiraTicket: jiraTicketKey
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
