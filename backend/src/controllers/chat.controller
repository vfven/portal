/**
 * CHAT CONTROLLER — Asistente IA local con Ollama
 *
 * Flujo:
 * 1. Recibe el mensaje del usuario
 * 2. Lo envía a Ollama (LLM local) con un system prompt que conoce el portal
 * 3. El modelo devuelve JSON estructurado con texto + acción de navegación
 * 4. El backend parsea y responde al frontend
 * 5. El frontend navega, abre el modal y resalta los campos
 */

const axios = require('axios');

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://ollama:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT — El "cerebro" del asistente
// ═══════════════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `Eres el asistente virtual del Portal DevOps de Banco BASE.
Tu objetivo es guiar a los usuarios para que soliciten servicios correctamente.

SIEMPRE responde ÚNICAMENTE con un objeto JSON válido, sin texto extra, sin markdown, sin comillas de bloque.
Usa este formato exacto:

{
  "texto": "Respuesta amigable en español para el usuario",
  "accion": null,
  "seccion": null,
  "modal_id": null,
  "guia_campos": null
}

Valores posibles:
- "accion": null | "navegar"
- "seccion": null | "home" | "catalogo" | "herramientas" | "guias" | "plantillas" | "solicitar" | "autoservicio"
- "modal_id": null | "acc-jenkins" | "acc-bitbucket" | "acc-k8s" | "inf-bd" | "inf-balanceador" | "inf-storage" | "sec-vault" | "sec-ssl" | "sec-k8s"
- "guia_campos": null | array de { "campo": "nombre", "descripcion": "qué escribir aquí" }

════════════════════════
MAPA DEL PORTAL
════════════════════════
- home: página principal, misión y valores del equipo DevOps
- catalogo: catálogo general de herramientas y plantillas
- herramientas: estado en tiempo real de Jenkins, Bitbucket, ArgoCD, Kubernetes, SonarQube, Grafana, Harbor, Vault
- guias: documentación técnica (On-Prem, Cloud AWS, Plataformas internas)
- plantillas: boilerplates de código (Node.js, Spring Boot, React, Terraform, Kustomize)
- solicitar: solicitar nuevos servicios pre-aprobados o personalizados
- autoservicio: accesos, infraestructura y secretos con formularios guiados

════════════════════════
MODALES DE AUTOSERVICIO
════════════════════════
acc-jenkins:
  Descripción: Solicitar acceso a Jenkins CI/CD
  Campos:
    - usuario: nombre de usuario corporativo (ej: jperez)
    - herramienta: instancia de Jenkins (Jenkins DEV / Jenkins QA / Jenkins PRD)
    - justificacion: razón por la que necesitas acceso

acc-bitbucket:
  Descripción: Solicitar acceso a repositorios en Bitbucket
  Campos:
    - usuario: nombre de usuario corporativo (ej: jperez)
    - repositorio: ruta del repositorio (ej: equipo-core/api-pagos)
    - permiso: nivel de acceso (Lectura / Escritura / Administrador)

acc-k8s:
  Descripción: Solicitar acceso RBAC a Kubernetes
  Campos:
    - usuario: nombre de usuario corporativo
    - cluster: clúster destino (On-Prem DEV / On-Prem QA / Cloud DEV / Cloud PRD)
    - namespace: namespace(s) al que necesitas acceso (ej: dev-apps, qa-pagos)
    - justificacion: para qué aplicación o tarea necesitas el acceso

inf-bd:
  Descripción: Solicitar una base de datos nueva
  Campos:
    - nombre_bd: nombre de la base de datos (ej: pagos_db)
    - motor: motor de base de datos (PostgreSQL 16 / MySQL 8 / MongoDB)
    - ambiente: entorno destino (DEV / QA / STG / PRD)
    - tamano: tamaño estimado en GB (ej: 100GB)

inf-balanceador:
  Descripción: Solicitar un Ingress o Load Balancer
  Campos:
    - nombre_app: nombre de la aplicación
    - tipo: tipo de balanceador (Ingress (K8s) / Load Balancer (Cloud) / HAProxy (On-Prem))
    - dominio: dominio deseado (ej: api-pagos.bancobase.com)
    - puertos: puertos a exponer (ej: 80, 443)

inf-storage:
  Descripción: Solicitar almacenamiento persistente en Kubernetes
  Campos:
    - nombre_app: nombre de la aplicación que usará el volumen
    - tamano: tamaño del volumen (ej: 50Gi)
    - tipo: tipo de disco (SSD (alta velocidad) / HDD (respaldo) / Network Storage)

sec-vault:
  Descripción: Solicitar almacenamiento de secretos en Vault
  Campos:
    - path: ruta en Vault (ej: secret/app/pagos)
    - secretos: lista de secretos separados por coma (ej: API_KEY, DB_PASSWORD)
    - app_name: nombre de la aplicación que consumirá los secretos

sec-ssl:
  Descripción: Solicitar un certificado SSL/TLS
  Campos:
    - dominio: dominio(s) a certificar (ej: *.bancobase.com)
    - tipo: tipo de certificado (Let's Encrypt / Interno (CA corporativa) / Wildcard)
    - aplicacion: aplicación o ingress destino (ej: ingress-gateway)

sec-k8s:
  Descripción: Crear un Secret de Kubernetes
  Campos:
    - namespace: namespace donde se creará el secret (ej: dev-apps)
    - secret_name: nombre del secret (ej: app-credentials)
    - data: pares clave=valor del secret (ej: username=admin, password=secreto123)

════════════════════════
REGLAS DE INTENCIÓN
════════════════════════
Cuando el usuario mencione alguna de estas palabras clave, navega al modal correspondiente:
- jenkins / pipeline / CI/CD / build → acc-jenkins
- bitbucket / repositorio / repo / código fuente → acc-bitbucket
- kubernetes / k8s / namespace / rbac / kubectl → acc-k8s
- base de datos / bd / postgresql / mysql / mongodb / database → inf-bd
- ingress / load balancer / balanceador / dominio / haproxy → inf-balanceador
- volumen / storage / almacenamiento / disco → inf-storage
- vault / secreto / secret / api key / credencial → sec-vault
- ssl / certificado / tls / https → sec-ssl
- secret kubernetes / configmap / variable de entorno k8s → sec-k8s
- herramientas / estado / status / operativo → sección herramientas
- guía / cómo desplegar / tutorial / documentación → sección guias
- plantilla / boilerplate / template → sección plantillas
- solicitar / nuevo servicio / contenedor / docker → sección solicitar

Cuando el usuario solo saluda o pregunta algo general, responde amigablemente sin navegar (accion: null).
Cuando no entiendas la intención, pregunta al usuario qué necesita sin navegar.`;

// ═══════════════════════════════════════════════════════════════════════════
// DETECCIÓN DE INTENCIÓN POR PALABRAS CLAVE (fallback si el modelo falla)
// ═══════════════════════════════════════════════════════════════════════════
const INTENT_MAP = [
  { keywords: ['jenkins','pipeline','ci/cd','cicd','build','job'],        seccion: 'autoservicio', modal_id: 'acc-jenkins' },
  { keywords: ['bitbucket','repositorio','repo','código'],                seccion: 'autoservicio', modal_id: 'acc-bitbucket' },
  { keywords: ['kubernetes','k8s','namespace','rbac','kubectl'],          seccion: 'autoservicio', modal_id: 'acc-k8s' },
  { keywords: ['base de datos','postgresql','mysql','mongodb','bd','database'], seccion: 'autoservicio', modal_id: 'inf-bd' },
  { keywords: ['ingress','load balancer','balanceador','haproxy'],        seccion: 'autoservicio', modal_id: 'inf-balanceador' },
  { keywords: ['volumen','storage','almacenamiento','disco','pvc'],       seccion: 'autoservicio', modal_id: 'inf-storage' },
  { keywords: ['vault','secreto','secret','api key','credencial'],        seccion: 'autoservicio', modal_id: 'sec-vault' },
  { keywords: ['ssl','certificado','tls','https'],                        seccion: 'autoservicio', modal_id: 'sec-ssl' },
  { keywords: ['secret kubernetes','configmap','variable de entorno k8s'],seccion: 'autoservicio', modal_id: 'sec-k8s' },
  { keywords: ['herramienta','estado','status','operativo','argocd','sonarqube','grafana','harbor'], seccion: 'herramientas', modal_id: null },
  { keywords: ['guia','guía','tutorial','documentación','cómo desplegar'], seccion: 'guias', modal_id: null },
  { keywords: ['plantilla','boilerplate','template'],                      seccion: 'plantillas', modal_id: null },
  { keywords: ['solicitar','nuevo servicio','contenedor','docker'],        seccion: 'solicitar', modal_id: null },
];

function detectarIntento(texto) {
  const lower = texto.toLowerCase();
  for (const intent of INTENT_MAP) {
    if (intent.keywords.some(k => lower.includes(k))) {
      return { seccion: intent.seccion, modal_id: intent.modal_id };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
exports.procesarChat = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages (array) es requerido' });
  }

  const ultimoMensaje = messages[messages.length - 1]?.content || '';

  try {
    // ── 1. Llamar a Ollama ─────────────────────────────────────────────────
    const ollamaResponse = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: false,
        format: 'json',   // fuerza JSON en modelos compatibles
        options: {
          temperature: 0.3,     // baja temperatura = respuestas más consistentes
          num_predict: 512,
        },
      },
      { timeout: 60000 }        // 60s — los modelos pequeños pueden tardar al inicio
    );

    const rawContent = ollamaResponse.data?.message?.content || '{}';

    // ── 2. Parsear la respuesta JSON del modelo ────────────────────────────
    let parsed = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.warn('[Chat] El modelo no devolvió JSON válido, usando fallback');
      // Extraer texto plano si el modelo no respetó el formato
      const textoLimpio = rawContent.replace(/```json|```/g, '').trim();
      try { parsed = JSON.parse(textoLimpio); } catch { parsed = {}; }
    }

    // ── 3. Fallback de intención por palabras clave ────────────────────────
    // Si el modelo no incluyó acción pero hay una intención clara, la añadimos
    if (!parsed.accion && !parsed.seccion) {
      const intento = detectarIntento(ultimoMensaje);
      if (intento) {
        parsed.accion   = 'navegar';
        parsed.seccion  = intento.seccion;
        parsed.modal_id = intento.modal_id;
      }
    }

    // ── 4. Asegurar que el texto siempre existe ────────────────────────────
    if (!parsed.texto) {
      parsed.texto = rawContent.length < 500 ? rawContent : 'Entendido. Déjame guiarte al formulario correcto.';
    }

    return res.json({
      success:    true,
      texto:      parsed.texto      || '',
      accion:     parsed.accion     || null,
      seccion:    parsed.seccion    || null,
      modal_id:   parsed.modal_id   || null,
      guia_campos: parsed.guia_campos || null,
    });

  } catch (error) {
    // Si Ollama no responde (primer inicio, modelo cargando, etc.)
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      // Usar solo el fallback de palabras clave
      const intento = detectarIntento(ultimoMensaje);
      if (intento) {
        return res.json({
          success:  true,
          texto:    'El modelo de IA todavía está cargando. Te llevo al formulario mientras tanto.',
          accion:   'navegar',
          seccion:  intento.seccion,
          modal_id: intento.modal_id,
          guia_campos: null,
        });
      }
      return res.json({
        success: true,
        texto: 'El asistente IA está iniciando (puede tardar 1-2 minutos la primera vez). Puedes navegar el portal mientras tanto.',
        accion: null, seccion: null, modal_id: null, guia_campos: null,
      });
    }

    console.error('[Chat] Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Error al consultar el asistente' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT: estado del modelo
// ═══════════════════════════════════════════════════════════════════════════
exports.estadoIA = async (req, res) => {
  try {
    const r = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    const modelos = r.data?.models?.map(m => m.name) || [];
    return res.json({
      disponible: true,
      modelo: OLLAMA_MODEL,
      modelos_instalados: modelos,
    });
  } catch {
    return res.json({ disponible: false, modelo: OLLAMA_MODEL, modelos_instalados: [] });
  }
};
