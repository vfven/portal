const axios = require('axios');
const config = require('../config');

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES PARA INTEGRACIÓN CON JIRA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea un ticket en Jira con los datos de la solicitud.
 * Usa ADF (Atlassian Document Format) para formatear la descripción.
 */
async function crearTicketJira(datos, idSolicitud, { tipoIssue = 'Solicitud', labels = [], categoria = null, subtipo = null } = {}) {
  if (!config.JIRA_API_TOKEN || config.JIRA_API_TOKEN === 'tu_api_token') {
    console.log('⚠️ JIRA_API_TOKEN no configurado. Saltando creación de ticket.');
    return null;
  }

  const solicitante = datos.email_solicitante || 'anonimo@bancobase.com';
  const resumen = `[${tipoIssue.toUpperCase()}] ${datos.nombreServicio} - ${idSolicitud}`;

  // Construir tabla de detalles para ADF
  let filasTabla = [
    ['Servicio',      datos.nombreServicio],
    ['Nº Solicitud',  idSolicitud],
    ['Solicitante',   solicitante],
    ['Fecha',         datos.fecha || new Date().toLocaleString('es-MX')],
  ];

  // Agregar campos dinámicos
  for (let [k, v] of Object.entries(datos)) {
    if (!['nombreServicio', 'email_solicitante', 'fecha'].includes(k) && v) {
      filasTabla.push([
        k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        String(v)
      ]);
    }
  }

  // Construir ADF (Atlassian Document Format)
  const adfDescription = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: `Solicitud de ${tipoIssue}` }]
      },
      {
        type: 'table',
        attrs: { isNumberColumnEnabled: false, layout: 'default' },
        content: filasTabla.map(([label, valor]) => ({
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: label }] }]
            },
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: valor }] }]
            },
          ],
        })),
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Ticket generado automáticamente desde el Portal de Autoservicio · Banco BASE.' }
        ]
      },
      // Bloque JSON consumido por Jira Automation → Jenkins.
      // Los delimitadores AUTO_DATA_START / AUTO_DATA_END permiten extraerlo
      // con regex en smart-values.
      {
        type: 'codeBlock',
        attrs: { language: 'json' },
        content: [{
          type: 'text',
          text:
            'AUTO_DATA_START\n' +
            JSON.stringify({
              ticket_solicitud_id: idSolicitud,
              categoria: categoria,
              subtipo:   subtipo,
              solicitante: solicitante,
              servicio:  datos.nombreServicio,
              fecha:     datos.fecha || new Date().toISOString(),
              datos:     Object.fromEntries(
                Object.entries(datos).filter(([k]) =>
                  !['email_solicitante', 'fecha', 'nombreServicio'].includes(k)
                )
              ),
            }, null, 2) +
            '\nAUTO_DATA_END',
        }],
      },
    ],
  };

  // Labels finales — incluyen categoria-* y subtipo-* si vienen
  const labelsFinales = [
    'autoservicio',
    datos.nombreServicio.toLowerCase().replace(/\s/g, '-'),
    ...labels,
  ];
  if (categoria) labelsFinales.push(`categoria-${categoria.toLowerCase()}`);
  if (subtipo)   labelsFinales.push(`subtipo-${subtipo.toLowerCase()}`);

  // Payload para Jira API
  const ticketData = {
    fields: {
      project:     { key: config.JIRA_PROJECT_KEY },
      issuetype:   { id: config.JIRA_TYPE_SOLICITUD },
      summary:     resumen,
      description: adfDescription,
      labels:      labelsFinales,
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
    console.log(`✅ Ticket Jira creado: ${response.data.key}`);
    return response.data.key;
  } catch (error) {
    console.error(`❌ Error Jira API: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    return null;
  }
}

/**
 * Agrega un comentario a un ticket existente en Jira.
 */
async function agregarComentarioJira(ticketKey, comentario) {
  if (!config.JIRA_API_TOKEN || !ticketKey) {
    console.log('⚠️ No se puede agregar comentario sin token o key.');
    return false;
  }

  const authBuffer = Buffer.from(`${config.JIRA_USER_EMAIL}:${config.JIRA_API_TOKEN}`).toString('base64');

  try {
    await axios.post(
      `${config.JIRA_DOMAIN}/rest/api/3/issue/${ticketKey}/comments`,
      {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: comentario }]
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Basic ${authBuffer}`,
          'Content-Type':  'application/json',
        },
      }
    );
    console.log(`✅ Comentario agregado a ${ticketKey}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al agregar comentario: ${error.message}`);
    return false;
  }
}

module.exports = {
  crearTicketJira,
  agregarComentarioJira,
};
