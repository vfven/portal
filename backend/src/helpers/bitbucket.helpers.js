/**
 * BITBUCKET HELPERS
 * Integración con Bitbucket Cloud para subir manifiestos YAML
 * 
 * Funciones:
 * - subirManifiestosBitbucket()    → Sube archivos YAML a repo
 * - crearPullRequestBitbucket()    → Crea PR automáticamente
 * - crearBranchBitbucket()         → Crea rama nueva
 */

const fetch = require('node-fetch');

/**
 * Autenticación Bitbucket (Basic Auth)
 * @returns {string} Header Authorization
 */
function obtenerAuthBitbucket() {
  const email = process.env.BITBUCKET_USER || 'digital@bancobase.com';
  const token = process.env.BITBUCKET_APP_PASSWORD || '';
  
  if (!token) {
    throw new Error('BITBUCKET_APP_PASSWORD no configurado en .env');
  }
  
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  return `Basic ${auth}`;
}

/**
 * Sube manifiestos YAML a Bitbucket
 * @param {Object} config - { repositorio, rama, carpeta, manifiestos, mensaje }
 * @returns {Promise<string>} SHA del commit
 */
async function subirManifiestosBitbucket(config) {
  try {
    const {
      repositorio = 'infrastructure',
      rama = 'main',
      carpeta,
      manifiestos = {}, // { 'deployment.yaml': 'content', ... }
      mensaje = 'Upload K8s manifests'
    } = config;

    const workspace = process.env.BITBUCKET_WORKSPACE || 'bancobase';
    const repoSlug = repositorio;
    const apiUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}`;

    console.log(`[Bitbucket] Subiendo manifiestos a ${workspace}/${repoSlug}/${carpeta}`);

    // 1. Crear rama si no existe
    const branchUrl = `${apiUrl}/refs/branches`;
    const authHeader = obtenerAuthBitbucket();

    try {
      await fetch(branchUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: rama,
          target: { hash: 'main' } // Crear desde main
        })
      });
      console.log(`[Bitbucket] Rama ${rama} creada`);
    } catch (e) {
      // La rama puede que ya exista, no es error crítico
      console.log(`[Bitbucket] Rama ${rama} ya existe`);
    }

    // 2. Subir cada archivo
    const commitShas = [];
    
    for (const [nombreArchivo, contenido] of Object.entries(manifiestos)) {
      const rutaCompleta = `${carpeta}/${nombreArchivo}`;
      const uploadUrl = `${apiUrl}/src`;

      const formData = new FormData();
      formData.append('files', new Blob([contenido], { type: 'text/yaml' }), rutaCompleta);
      formData.append('message', `${mensaje}: ${nombreArchivo}`);
      formData.append('branch', rama);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error subiendo ${nombreArchivo}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.commit && result.commit.hash) {
        commitShas.push(result.commit.hash);
        console.log(`[Bitbucket] ✓ ${nombreArchivo} subido (${result.commit.hash})`);
      }
    }

    // Retornar primer SHA (pueden haber múltiples commits)
    return commitShas[0] || 'unknown';

  } catch (error) {
    console.error('[Bitbucket] Error subiendo manifiestos:', error);
    throw error;
  }
}

/**
 * Crea Pull Request en Bitbucket
 * @param {Object} config - { repositorio, titulo, descripcion, srcBranch, dstBranch }
 * @returns {Promise<string>} URL del PR
 */
async function crearPullRequestBitbucket(config) {
  try {
    const {
      repositorio = 'infrastructure',
      titulo,
      descripcion,
      srcBranch,
      dstBranch = 'main'
    } = config;

    const workspace = process.env.BITBUCKET_WORKSPACE || 'bancobase';
    const apiUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repositorio}`;
    const prUrl = `${apiUrl}/pullrequests`;
    const authHeader = obtenerAuthBitbucket();

    console.log(`[Bitbucket] Creando PR: ${srcBranch} → ${dstBranch}`);

    const response = await fetch(prUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: titulo,
        description: descripcion,
        source: {
          branch: {
            name: srcBranch
          }
        },
        destination: {
          branch: {
            name: dstBranch
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error creando PR: ${response.statusText}`);
    }

    const result = await response.json();
    const prLink = result.links.html.href;
    
    console.log(`[Bitbucket] ✓ PR creado: ${prLink}`);
    return prLink;

  } catch (error) {
    console.error('[Bitbucket] Error creando PR:', error);
    throw error;
  }
}

/**
 * Crea rama en Bitbucket
 * @param {Object} config - { repositorio, nombreRama, desdeRama }
 * @returns {Promise<void>}
 */
async function crearBranchBitbucket(config) {
  try {
    const {
      repositorio = 'infrastructure',
      nombreRama,
      desdeRama = 'main'
    } = config;

    const workspace = process.env.BITBUCKET_WORKSPACE || 'bancobase';
    const apiUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repositorio}`;
    const branchUrl = `${apiUrl}/refs/branches`;
    const authHeader = obtenerAuthBitbucket();

    console.log(`[Bitbucket] Creando rama: ${nombreRama} desde ${desdeRama}`);

    const response = await fetch(branchUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nombreRama,
        target: { hash: desdeRama }
      })
    });

    if (!response.ok) {
      throw new Error(`Error creando rama: ${response.statusText}`);
    }

    console.log(`[Bitbucket] ✓ Rama ${nombreRama} creada`);

  } catch (error) {
    console.error('[Bitbucket] Error creando rama:', error);
    throw error;
  }
}

/**
 * Lista archivos en carpeta de Bitbucket
 * @param {Object} config - { repositorio, rama, carpeta }
 * @returns {Promise<Array>} Lista de archivos
 */
async function listarArchivosBitbucket(config) {
  try {
    const {
      repositorio = 'infrastructure',
      rama = 'main',
      carpeta
    } = config;

    const workspace = process.env.BITBUCKET_WORKSPACE || 'bancobase';
    const apiUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repositorio}`;
    const srcUrl = `${apiUrl}/src/${rama}/${carpeta}`;
    const authHeader = obtenerAuthBitbucket();

    const response = await fetch(srcUrl, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      throw new Error(`Error listando archivos: ${response.statusText}`);
    }

    const result = await response.json();
    return result.values || [];

  } catch (error) {
    console.error('[Bitbucket] Error listando archivos:', error);
    throw error;
  }
}

module.exports = {
  subirManifiestosBitbucket,
  crearPullRequestBitbucket,
  crearBranchBitbucket,
  listarArchivosBitbucket
};
