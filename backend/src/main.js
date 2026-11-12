// ============================================================
// BANCO BASE Â· DevOps Platform SPA Â· main.js
// Autogenerado por scripts/split-legacy.ps1.
// Las funciones usadas por atributos onclick="..." se exponen
// al objeto window al final para mantener compatibilidad con
// el markup original. En una prÃ³xima iteraciÃ³n conviene
// reemplazar los onclick por addEventListener.
// ============================================================

import './styles.css';

// ---- SCRIPT PRINCIPAL ----------------------------------------
// ===============================================
// CONFIGURACIÓN DE API
// ===============================================
var API_BASE = '/api';

// ===============================================
// FUNCIÓN AUXILIAR: ENVIAR AL BACKEND
// ===============================================
function enviarAlBackend(endpoint, datos, feedbackElement, onSuccess) {
  if (onSuccess === undefined) onSuccess = null;
  
  fetch(API_BASE + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    if (data.success) {
      feedbackElement.className = 'feedback success';
      feedbackElement.innerHTML = '✅ ' + data.mensaje + '<br>ID: ' + data.id + '<br>Jira: ' + (data.jiraTicket || 'N/A');
      if (onSuccess) onSuccess();
      setTimeout(function() { feedbackElement.className = 'feedback'; }, 5000);
    } else {
      feedbackElement.className = 'feedback error';
      feedbackElement.innerHTML = '❌ ' + data.error + '<br>' + (data.detalles || []).join('<br>');
      setTimeout(function() { feedbackElement.className = 'feedback'; }, 5000);
    }
  })
  .catch(function(error) {
    feedbackElement.className = 'feedback error';
    feedbackElement.innerHTML = '❌ Error de conexión: ' + error.message;
    setTimeout(function() { feedbackElement.className = 'feedback'; }, 5000);
  });
}

// ===============================================
// SPA ROUTER
// ===============================================
var VIEWS = ['home','catalogo','herramientas','guias','plantillas','solicitar','autoservicio','despliegue'];

function navigate(viewId) {
  VIEWS.forEach(function(v) {
    var el = document.getElementById('view-'+v);
    if (el) {
      if (v === viewId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  });
  
  var links = document.querySelectorAll('.nav-links a');
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    if (a.dataset.view === viewId) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  }
  
  window.scrollTo({top:0, behavior:'smooth'});
  
  if (viewId === 'herramientas' && !window._herLoaded) { renderHerramientas(); window._herLoaded = true; }
  if (viewId === 'guias' && !window._guiLoaded) { renderAllGuides(); window._guiLoaded = true; }
  if (viewId === 'plantillas' && !window._plaLoaded) { renderPlantillas(); window._plaLoaded = true; }
  if (viewId === 'solicitar' && !window._solLoaded) { renderServicios(); window._solLoaded = true; }
  if (viewId === 'autoservicio' && !window._autLoaded) { renderAutoservicio(); window._autLoaded = true; }
  
  history.pushState({view:viewId}, '', '#'+viewId);
}

window.addEventListener('popstate', function(e) {
  if (e.state && e.state.view) navigate(e.state.view);
});

var initHash = window.location.hash.replace('#','') || 'home';
if (VIEWS.indexOf(initHash) !== -1) navigate(initHash);
else navigate('catalogo');

// ===============================================
// DATOS CON ICONOS SVG (devicon)
// ===============================================
// URLs reales confirmadas. Los entornos sin URL conocida apuntan a '/' (home
// del portal) como fallback — se completarán a medida que se confirmen.
var HERRAMIENTAS = [
  { id:'jenkins', nombre:'Jenkins', desc:'CI/CD Pipeline · Automatización de despliegues', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg', estado:'operational', version:'2.426.2', sla:'99.9%', doc:'/', owner:'Equipo DevOps',
    entornos:[
      {nombre:'Jenkins DEV',url:'https://jenks-dev.bancobase.com',badge:'dev',text:'DEV'},
      {nombre:'Jenkins QA', url:'/',                              badge:'qa', text:'QA'},
      {nombre:'Jenkins PRD',url:'http://jnk.p.gslb:8080',          badge:'prd',text:'PRD'}
    ]},
  { id:'bitbucket', nombre:'Bitbucket', desc:'Repositorios Git · Code Review · Pipelines', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bitbucket/bitbucket-original.svg', estado:'operational', version:'Cloud', sla:'99.95%', doc:'/', owner:'Equipo DevOps',
    entornos:[
      {nombre:'Bitbucket',url:'/',badge:'prd',text:'WEB'}
    ]},
  { id:'argocd', nombre:'Argo CD', desc:'GitOps · Despliegue continuo en Kubernetes', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/argocd/argocd-original.svg', estado:'operational', version:'2.10.3', sla:'99.9%', doc:'/', owner:'Equipo DevOps',
    entornos:[
      {nombre:'Argo CD DEV',url:'/',badge:'dev',text:'DEV'},
      {nombre:'Argo CD QA', url:'/',badge:'qa', text:'QA'},
      {nombre:'Argo CD PRD',url:'/',badge:'prd',text:'PRD'}
    ]},
  { id:'kubernetes', nombre:'Kubernetes', desc:'Orquestación de contenedores · Clústeres', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg', estado:'operational', version:'1.28.5', sla:'99.95%', doc:'/', owner:'Equipo DevOps',
    entornos:[
      {nombre:'K8s DEV', url:'https://kubernetes-dev.bancobase.net',badge:'dev',text:'DEV'},
      {nombre:'K8s QA',  url:'https://kubernetes-qa.bancobase.net', badge:'qa', text:'QA'},
      {nombre:'K8s PRD', url:'https://k8s-prod.dombase.net',        badge:'prd',text:'PRD'}
    ]},
  { id:'sonarqube', nombre:'SonarQube', desc:'Calidad de código · Análisis estático · Seguridad', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sonarqube/sonarqube-original.svg', estado:'operational', version:'10.4.1', sla:'99.5%', doc:'/', owner:'Equipo DevOps',
    entornos:[
      {nombre:'SonarQube DEV',url:'https://sonar-dev.bancobase.com',badge:'dev',text:'DEV'},
      {nombre:'SonarCloud',   url:'https://sonarcloud.io/',          badge:'prd',text:'WEB'}
    ]},
  { id:'monitoring', nombre:'Prometheus + Grafana', desc:'Monitoreo · Métricas · Alertas · Dashboards', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg', estado:'operational', version:'Prom 2.50 / Grafana 10.4', sla:'99.9%', doc:'/', owner:'Equipo DevOps',
    entornos:[
      {nombre:'Grafana DEV',url:'/',badge:'dev',text:'DEV'},
      {nombre:'Grafana PRD',url:'/',badge:'prd',text:'PRD'}
    ]},
  { id:'harbor', nombre:'Harbor', desc:'Registro de imágenes Docker · Escaneo de vulnerabilidades', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/harbor/harbor-original.svg', estado:'operational', version:'2.10.2', sla:'99.9%', doc:'/', owner:'Equipo DevOps',
    entornos:[
      {nombre:'Harbor Registry',url:'https://registry.bancobase.net',badge:'prd',text:'WEB'}
    ]},
  { id:'vault', nombre:'Vault', desc:'Gestión de secretos · Cifrado · Accesos', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vault/vault-original.svg', estado:'operational', version:'1.15.2', sla:'99.99%', doc:'/', owner:'Equipo Seguridad',
    entornos:[
      {nombre:'Vault DEV',url:'/',badge:'dev',text:'DEV'},
      {nombre:'Vault PRD',url:'/',badge:'prd',text:'PRD'}
    ]}
];

var PLANTILLAS = [
  { nombre:'API REST Node.js + Express', badge:'Backend', cat:'backend', desc:'Boilerplate con estructura MVC, tests unitarios, Dockerfile y pipeline Jenkins.', tags:['Node.js','Express','Jest','Docker'], url:'https://bitbucket.banco-base.com/projects/BOILERPLATES/repos/nodejs-api', code:'// app.js\nconst express = require(\'express\');\nconst app = express();\napp.use(express.json());\nmodule.exports = app;' },
  { nombre:'API Spring Boot Java', badge:'Backend', cat:'backend', desc:'Microservicio con Spring Boot 3, pruebas, Docker y configuración para Kubernetes.', tags:['Java 17','Spring Boot','Maven','JUnit'], url:'https://bitbucket.banco-base.com/projects/BOILERPLATES/repos/spring-boot-api', code:'@SpringBootApplication\npublic class Application {\n  public static void main(String[] args) {\n    SpringApplication.run(Application.class, args);\n  }\n}' },
  { nombre:'React + TypeScript', badge:'Frontend', cat:'frontend', desc:'Aplicación React con TypeScript, routing, tests y pipeline CI/CD.', tags:['React','TypeScript','Vite','Vitest'], url:'https://bitbucket.banco-base.com/projects/BOILERPLATES/repos/angular-boilerplate', code:'import React from \'react\';\nconst App: React.FC = () => {\n  return <div>Hello Banco BASE</div>;\n};\nexport default App;' },
  { nombre:'Go + React Boilerplate', badge:'Fullstack', cat:'backend', desc:'Aplicación fullstack con backend en Go y frontend React integrados.', tags:['Go','React','Docker','K8s'], url:'https://bitbucket.banco-base.com/projects/BOILERPLATES/repos/go-react-boilerplate', code:'func main() {\n  http.HandleFunc("/", handler)\n  log.Fatal(http.ListenAndServe(":8080", nil))\n}' },
  { nombre:'Terraform para AWS', badge:'Infraestructura', cat:'infra', desc:'Módulos Terraform para desplegar infraestructura en AWS (VPC, EKS, RDS).', tags:['Terraform','AWS','Infra as Code'], url:'https://bitbucket.banco-base.com/projects/BOILERPLATES/repos/cloud-deploy-template', code:'module "vpc" {\n  source = "./modules/vpc"\n  cidr   = "10.0.0.0/16"\n}' },
  { nombre:'Docker Compose Stack', badge:'Docker', cat:'docker', desc:'Stack completo con servicios pre-configurados para desarrollo local.', tags:['Docker','Compose','Local Dev'], url:'https://bitbucket.banco-base.com/projects/BOILERPLATES/repos/docker-compose-stack', code:'version: "3.8"\nservices:\n  app:\n    build: .\n    ports:\n      - "8080:8080"' },
  { nombre:'Manifiestos Kustomize', badge:'Kustomize', cat:'kustomize', desc:'Estructura base con overlays para dev/qa/prod lista para usar.', tags:['Kustomize','K8s','GitOps'], url:'https://bitbucket.banco-base.com/projects/BOILERPLATES/repos/docker-examples', code:'resources:\n  - deployment.yaml\n  - service.yaml\ncommonLabels:\n  app: mi-servicio' }
];

var SERVICIOS_PREAPROBADOS = [
  { id:'docker-ubuntu', nombre:'Ubuntu 22.04', desc:'Contenedor base con herramientas esenciales', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ubuntu/ubuntu-plain.svg', cat:'contenedor', tiempo:'5 min', disponible:true },
  { id:'docker-nginx', nombre:'Nginx + React', desc:'Servidor para apps estáticas', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg', cat:'contenedor', tiempo:'5 min', disponible:true },
  { id:'docker-postgres', nombre:'PostgreSQL DB', desc:'Instancia relacional con persistencia configurada', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', cat:'db', tiempo:'10 min', disponible:true },
  { id:'docker-redis', nombre:'Redis Cache', desc:'Caché en memoria con persistencia', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg', cat:'cache', tiempo:'5 min', disponible:true },
  { id:'docker-mongo', nombre:'MongoDB', desc:'Base de datos NoSQL para documentos', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg', cat:'db', tiempo:'Próximamente', disponible:false },
  { id:'jenkins-agent', nombre:'Jenkins Agent', desc:'Nodo worker integrado para tareas pesadas', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg', cat:'ci-cd', tiempo:'15 min', disponible:true },
  { id:'argocd-app', nombre:'App Argo CD', desc:'Registro inmediato GitOps de aplicación', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/argocd/argocd-original.svg', cat:'gitops', tiempo:'10 min', disponible:true },
  { id:'sonar-project', nombre:'Proyecto SonarQube', desc:'Métricas estáticas y Quality Gates configurados', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sonarqube/sonarqube-original.svg', cat:'quality', tiempo:'5 min', disponible:true },
  { id:'k8s-namespace', nombre:'Namespace K8s', desc:'Aislamiento total con quotas y networkpolicies', icono:'https://cdn.simpleicons.org/kubernetes/326CE5', cat:'k8s', tiempo:'10 min', disponible:true },
  { id:'terraform-ws', nombre:'Terraform Workspace', desc:'Infraestructura como código aislada', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg', cat:'iac', tiempo:'10 min', disponible:true },
  { id:'grafana-dash', nombre:'Dashboard Grafana', desc:'Panel centralizado conectado a Prometheus', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg', cat:'monitoring', tiempo:'20 min', disponible:true }
];

var AUTOSERVICIO = {
  accesos: [
    { id:'acc-jenkins', nombre:'Acceso a Jenkins', desc:'Permisos para ejecutar pipelines, ver logs y administrar jobs.', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg', badge:'Acceso', badgeClass:'badge-access', tiempo:'~30 min', campos:[{name:'usuario',label:'Usuario corporativo',type:'text',ph:'ej: jperez'},{name:'herramienta',label:'Instancia',type:'select',opts:['Jenkins DEV','Jenkins QA','Jenkins PRD']},{name:'justificacion',label:'Justificación',type:'textarea',ph:'¿Por qué necesitas acceso?'}] },
    { id:'acc-bitbucket', nombre:'Acceso a Bitbucket', desc:'Permisos de lectura/escritura en repositorios específicos.', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bitbucket/bitbucket-original.svg', badge:'Acceso', badgeClass:'badge-access', tiempo:'~30 min', campos:[{name:'usuario',label:'Usuario corporativo',type:'text',ph:'ej: jperez'},{name:'repositorio',label:'Repositorio(s)',type:'text',ph:'ej: equipo-core/api-pagos'},{name:'permiso',label:'Nivel de permiso',type:'select',opts:['Lectura','Escritura','Administrador']}] },
    { id:'acc-k8s', nombre:'Acceso a Kubernetes', desc:'Acceso RBAC a namespaces en los clústeres K8s.', icono:'https://cdn.simpleicons.org/kubernetes/326CE5', badge:'Acceso', badgeClass:'badge-access', tiempo:'~1h', campos:[{name:'usuario',label:'Usuario corporativo',type:'text',ph:'ej: jperez'},{name:'cluster',label:'Clúster',type:'select',opts:['On-Prem DEV','On-Prem QA','Cloud DEV','Cloud PRD']},{name:'namespace',label:'Namespace(s)',type:'text',ph:'ej: dev-apps, qa-pagos'},{name:'justificacion',label:'Justificación',type:'textarea',ph:'¿Para qué aplicación?'}] },
    {
      id:'acc-red',
      nombre:'Comunicación de red',
      desc:'Apertura de reglas de firewall entre hosts (On-Prem y Cloud).',
      icono:'https://cdn.simpleicons.org/cisco/1BA0D7',
      badge:'Acceso', badgeClass:'badge-access', tiempo:'~1h',
      campos:[
        // Origen
        { name:'ip_origen', label:'IP(s) Origen', type:'text',
          ph:'10.51.52.92, 10.51.52.86',
          pattern:'^\\s*(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(\\s*,\\s*\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})*\\s*$',
          title:'Una o varias IPs separadas por coma. Ej: 10.51.52.92, 10.51.52.86',
          hint:'Puedes ingresar varias separadas por coma.' },
        { name:'hostname_origen', label:'Hostname(s) Origen', type:'text',
          ph:'MTY-ALE-QTRC002, MTY-ALE-QTRW004',
          pattern:'^\\s*([A-Za-z0-9][A-Za-z0-9.-]*)(\\s*,\\s*[A-Za-z0-9][A-Za-z0-9.-]*)*\\s*$',
          title:'Uno o varios hostnames separados por coma. Solo letras, números, puntos y guiones.',
          hint:'Debe coincidir en cantidad con las IPs de origen.' },
        // Destino
        { name:'ip_destino', label:'IP(s) Destino', type:'text',
          ph:'10.50.53.9',
          pattern:'^\\s*(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(\\s*,\\s*\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})*\\s*$',
          title:'Una o varias IPs destino separadas por coma.' },
        { name:'hostname_destino', label:'Hostname(s) Destino', type:'text',
          ph:'MTY-ALE-QHAH003',
          pattern:'^\\s*([A-Za-z0-9][A-Za-z0-9.-]*)(\\s*,\\s*[A-Za-z0-9][A-Za-z0-9.-]*)*\\s*$',
          title:'Uno o varios hostnames separados por coma.' },
        // Transporte
        { name:'puertos', label:'Puerto(s)', type:'text',
          ph:'9083, 443',
          pattern:'^\\s*([0-9]{1,5})(\\s*,\\s*[0-9]{1,5})*\\s*$',
          title:'Uno o varios puertos (1-65535) separados por coma.',
          hint:'Ej: 443  ·  443, 8443  ·  9083' },
        { name:'protocolo', label:'Protocolo', type:'select',
          opts:['TCP','UDP','ICMP','TCP+UDP'] },
        { name:'sentido', label:'Sentido', type:'select',
          opts:['UNIDIRECTIONAL','BIDIRECTIONAL'] },
        { name:'ambiente', label:'Ambiente', type:'select',
          opts:['DEV','QA','STG','PRD'] },
        // Contexto
        { name:'justificacion', label:'Justificación', type:'textarea', rows:4,
          ph:'Describe la aplicación/servicio y la razón de la comunicación.' }
      ]
    }
  ],
  infra: [
    {
      id:'inf-vm',
      nombre:'Provisión de VM',
      desc:'Alta de máquina virtual (On-Prem / Cloud) con plantilla y discos.',
      icono:'https://cdn.simpleicons.org/vmware/607078',
      badge:'Infraestructura', badgeClass:'badge-infra', tiempo:'~3h',
      campos:[
        // ── Identidad ────────────────────────────────────
        { name:'centro_datos', label:'Centro de datos', type:'select',
          opts:['Querétaro','Monterrey','Ciudad de México','Cloud AWS','Cloud Azure'] },
        { name:'template', label:'Plantilla / Tipo de SO', type:'select',
          opts:['PostgreSQL (TMPLPSG)','MySQL (TMPLMYS)','MongoDB (TMPLMNG)','SQL Server (TMPLMSS)',
                'Linux Base (TMPLLNX)','Windows Server (TMPLWIN)','Nginx (TMPLNGX)','Tomcat (TMPLTCT)'] },
        { name:'nombre_vm', label:'Nombre de VM', type:'text',
          ph:'XVL-Q2INFRTEST1',
          pattern:'^[A-Z0-9][A-Z0-9-]{2,30}$',
          title:'Mayúsculas, dígitos y guiones. 3-31 caracteres. Debe empezar con letra o número.' },
        { name:'proyecto', label:'Proyecto', type:'text', ph:'Pruebas' },
        { name:'ambiente', label:'Ambiente', type:'select',
          opts:['DEV','QA','STG','PRD'] },
        { name:'rol', label:'Rol / Función', type:'select',
          opts:['DB','App','Web','Cache','Middleware','Monitoring','Build','Otro'] },
        { name:'vm_existente', label:'¿VM existente?', type:'select',
          opts:['No','Sí'] },
        { name:'propietario', label:'Propietario', type:'text', ph:'Hector Cano' },
        { name:'appliance', label:'¿Appliance?', type:'select',
          opts:['No','Sí'] },
        // ── Sistema ──────────────────────────────────────
        { name:'os', label:'Sistema operativo', type:'select',
          opts:['Linux','Windows'] },
        { name:'claves', label:'Clave del proyecto', type:'text', ph:'INFR',
          pattern:'^[A-Z]{2,8}$', title:'2-8 letras mayúsculas.' },
        { name:'clasificacion', label:'Clasificación de datos', type:'select',
          opts:['Pública','Interna','Confidencial','Restringida','Base de datos'] },
        // ── Recursos ─────────────────────────────────────
        { name:'vcpus', label:'vCPUs', type:'select',
          opts:['2','4','6','8','10','12','16','24','32'] },
        { name:'ram_gb', label:'RAM (GB)', type:'select',
          opts:['4','8','12','16','20','24','32','48','64','96','128'] },
        // ── Discos adicionales (repeater) ────────────────
        { name:'discos', label:'Discos adicionales',
          type:'repeater',
          fields:[
            { name:'nombre', label:'Nombre / Letra', type:'text', ph:'data  ·  E:' },
            { name:'size_gb', label:'Tamaño (GB)', type:'number', min:1, max:4096, step:1, ph:'10' }
          ],
          hint:'Agrega una fila por cada disco adicional (sin incluir el disco de sistema).' },
        // ── Acceso ───────────────────────────────────────
        { name:'grupo_usuarios', label:'Grupo de usuarios', type:'text', ph:'dba' },
        { name:'software', label:'Software a instalar', type:'text', ph:'postgresql-18' },
        // ── Libres ───────────────────────────────────────
        { name:'notas', label:'Notas adicionales', type:'textarea', rows:2,
          ph:'Información complementaria (opcional).', required:false },
        { name:'justificacion', label:'Justificación', type:'textarea', rows:3,
          ph:'Describe el caso de uso y la razón del provisionamiento.' }
      ]
    },
    { id:'inf-bd', nombre:'Base de datos', desc:'Nueva BD gestionada en On-Prem o Cloud.', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', badge:'Infraestructura', badgeClass:'badge-infra', tiempo:'~2h',
      campos:[{name:'nombre_bd',label:'Nombre de la BD',type:'text',ph:'ej: pagos_db'},{name:'motor',label:'Motor',type:'select',opts:['PostgreSQL 16','MySQL 8','MongoDB']},{name:'ambiente',label:'Ambiente',type:'select',opts:['DEV','QA','STG','PRD']},{name:'tamano',label:'Tamaño estimado',type:'text',ph:'ej: 100GB'}]},
    { id:'inf-balanceador', nombre:'Ingress / Load Balancer', desc:'Balanceador o Ingress para tu aplicación.', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg', badge:'Infraestructura', badgeClass:'badge-infra', tiempo:'~1.5h',
      campos:[{name:'nombre_app',label:'Nombre de la app',type:'text',ph:'ej: api-pagos'},{name:'tipo',label:'Tipo',type:'select',opts:['Ingress (K8s)','Load Balancer (Cloud)','HAProxy (On-Prem)']},{name:'dominio',label:'Dominio deseado',type:'text',ph:'ej: api-pagos.banco-base.com'},{name:'puertos',label:'Puertos',type:'text',ph:'ej: 80, 443'}]},
    { id:'inf-storage', nombre:'Almacenamiento persistente', desc:'Volúmenes persistentes para Kubernetes.', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg', badge:'Infraestructura', badgeClass:'badge-infra', tiempo:'~1h',
      campos:[{name:'nombre_app',label:'Nombre de la app',type:'text',ph:'ej: logs-processor'},{name:'tamano',label:'Tamaño',type:'text',ph:'ej: 50Gi'},{name:'tipo',label:'Tipo',type:'select',opts:['SSD (alta velocidad)','HDD (respaldo)','Network Storage']}]}
  ],
  secretos: [
    { id:'sec-vault', nombre:'Secretos en Vault', desc:'Almacenamiento de API keys, contraseñas y tokens.', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vault/vault-original.svg', badge:'Secretos', badgeClass:'badge-secret', tiempo:'~30 min',
      campos:[{name:'path',label:'Path en Vault',type:'text',ph:'ej: secret/app/pagos'},{name:'secretos',label:'Lista de secretos',type:'textarea',ph:'ej: API_KEY, DB_PASSWORD'},{name:'app_name',label:'Aplicación consumidora',type:'text',ph:'ej: api-pagos'}]},
    { id:'sec-ssl', nombre:'Certificado SSL/TLS', desc:'Certificado para dominio interno o externo.', icono:'https://cdn.simpleicons.org/letsencrypt/3A9B5F', badge:'Certificados', badgeClass:'badge-secret', tiempo:'~1h',
      campos:[{name:'dominio',label:'Dominio(s)',type:'text',ph:'ej: *.banco-base.com'},{name:'tipo',label:'Tipo',type:'select',opts:["Let's Encrypt","Interno (CA corporativa)","Wildcard"]},{name:'aplicacion',label:'Aplicación destino',type:'text',ph:'ej: ingress-gateway'}]},
    { id:'sec-k8s', nombre:'Secret Kubernetes', desc:'Secret de K8s para variables de entorno.', icono:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg', badge:'Secretos', badgeClass:'badge-secret', tiempo:'~15 min',
      campos:[{name:'namespace',label:'Namespace',type:'text',ph:'ej: dev-apps'},{name:'secret_name',label:'Nombre del Secret',type:'text',ph:'ej: app-credentials'},{name:'data',label:'Datos (key=value)',type:'textarea',ph:'ej: username=admin\npassword=secret123'}]}
  ]
};

// ===============================================
// RENDER: CATÁLOGO
// ===============================================
(function renderCatalogo() {
  var tg = document.getElementById('cat-toolsGrid');
  if(tg) {
    var html = '';
    for (var i = 0; i < HERRAMIENTAS.length; i++) {
      var h = HERRAMIENTAS[i];
      html += '<div class="tool-card" onclick="navigate(\'herramientas\')"><div class="tool-icon"><img src="' + h.icono + '" alt="' + h.nombre + '" onerror="this.style.display=\'none\'"></div><div class="tool-info"><h3>' + h.nombre + '</h3><p>' + h.desc + '</p></div><div class="tool-arrow">→</div></div>';
    }
    tg.innerHTML = html;
  }
  
  var tpg = document.getElementById('cat-templatesGrid');
  if(tpg) {
    var html = '';
    for (var i = 0; i < 4 && i < PLANTILLAS.length; i++) {
      var p = PLANTILLAS[i];
      html += '<div class="template-card" onclick="navigate(\'plantillas\')"><span class="template-badge">' + p.badge + '</span><h3>' + p.nombre + '</h3><p>' + p.desc + '</p><div class="template-tags">';
      for (var j = 0; j < p.tags.length; j++) {
        html += '<span class="tag">' + p.tags[j] + '</span>';
      }
      html += '</div></div>';
    }
    tpg.innerHTML = html;
  }
})();

// ===============================================
// RENDER: HERRAMIENTAS
// ===============================================
function renderHerramientas(filtro) {
  if (filtro === undefined) filtro = 'all';
  var grid = document.getElementById('her-toolsGrid');
  if(!grid) return;
  
  var filtradas = [];
  for (var i = 0; i < HERRAMIENTAS.length; i++) {
    if (filtro === 'all' || HERRAMIENTAS[i].estado === filtro) {
      filtradas.push(HERRAMIENTAS[i]);
    }
  }
  
  var estadoMap = { operational:['status-operational','Operativo'], warning:['status-warning','Atención'], incident:['status-incident','Incidente'] };
  var html = '';
  
  for (var i = 0; i < filtradas.length; i++) {
    var h = filtradas[i];
    var estadoInfo = estadoMap[h.estado] || ['',''];
    var cls = estadoInfo[0];
    var txt = estadoInfo[1];
    
    html += '<div class="tool-detailed-card"><div class="tool-header" onclick="toggleTool(\'' + h.id + '\')"><div class="tool-title-section"><div class="tool-icon-large"><img src="' + h.icono + '" alt="' + h.nombre + '" onerror="this.style.display=\'none\'"></div><div class="tool-info"><h2>' + h.nombre + '</h2><p>' + h.desc + '</p></div></div><div class="tool-status"><span class="status-badge ' + cls + '">' + txt + '</span><span class="version-badge">v' + h.version + '</span><span class="tool-expand" id="exp-' + h.id + '">▼</span></div></div><div class="tool-body" id="body-' + h.id + '"><div class="env-section"><h3>Accesos directos</h3><div class="env-buttons">';
    
    for (var j = 0; j < h.entornos.length; j++) {
      var e = h.entornos[j];
      html += '<a href="' + e.url + '" class="env-link" target="_blank" onclick="event.stopPropagation()">' + e.nombre + ' <span class="env-badge-small env-badge-' + e.badge + '">' + e.text + '</span></a>';
    }
    
    html += '</div></div><div class="info-grid-tool"><div class="info-item"><div class="info-label">SLA</div><div class="info-value">' + h.sla + '</div></div><div class="info-item"><div class="info-label">Owner</div><div class="info-value">' + h.owner + '</div></div><div class="info-item"><div class="info-label">Docs</div><div class="info-value"><a href="' + h.doc + '" target="_blank" onclick="event.stopPropagation()">Ver documentación →</a></div></div></div></div></div>';
  }
  
  grid.innerHTML = html;
  
  var span = document.getElementById('her-lastUpdate');
  if(span) {
    var now = new Date();
    span.textContent = now.toLocaleString('es-MX',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});
  }
}

function toggleTool(id) {
  var body = document.getElementById('body-'+id);
  var exp = document.getElementById('exp-'+id);
  if(body) body.classList.toggle('open');
  if(exp) exp.classList.toggle('open');
}

// Filtros para herramientas
var filterBtns = document.querySelectorAll('#view-herramientas .filter-btn');
for (var i = 0; i < filterBtns.length; i++) {
  (function(btn) {
    btn.addEventListener('click', function() {
      var parent = this.parentElement;
      var btns = parent.querySelectorAll('.filter-btn');
      for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('active');
      }
      this.classList.add('active');
      renderHerramientas(this.dataset.filter);
    });
  })(filterBtns[i]);
}

// ===============================================
// RENDER: PLANTILLAS
// ===============================================
function renderPlantillas(filtro) {
  if (filtro === undefined) filtro = 'all';
  var grid = document.getElementById('pla-templatesGrid');
  if(!grid) return;
  
  var filtradas = [];
  for (var i = 0; i < PLANTILLAS.length; i++) {
    if (filtro === 'all' || PLANTILLAS[i].cat === filtro) {
      filtradas.push(PLANTILLAS[i]);
    }
  }
  
  var html = '';
  for (var i = 0; i < filtradas.length; i++) {
    var p = filtradas[i];
    var nombreEscapado = p.nombre.replace(/'/g, "\\'");
    html += '<div class="template-card" onclick="openTemplateModal(\'' + nombreEscapado + '\')"><span class="template-badge">' + p.badge + '</span><h3>' + p.nombre + '</h3><p>' + p.desc + '</p><div class="template-tags">';
    for (var j = 0; j < p.tags.length; j++) {
      html += '<span class="tag">' + p.tags[j] + '</span>';
    }
    html += '</div></div>';
  }
  grid.innerHTML = html;
}

// Filtros para plantillas
var plaFilterBtns = document.querySelectorAll('#pla-filters .filter-btn');
for (var i = 0; i < plaFilterBtns.length; i++) {
  (function(btn) {
    btn.addEventListener('click', function() {
      var parent = this.parentElement;
      var btns = parent.querySelectorAll('.filter-btn');
      for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('active');
      }
      this.classList.add('active');
      renderPlantillas(this.dataset.filter);
    });
  })(plaFilterBtns[i]);
}

function toggleGuide() {
  var body = document.getElementById('guideBody');
  var exp = document.getElementById('guideExpand');
  if(body) body.classList.toggle('open');
  if(exp) exp.classList.toggle('open');
}

function openTemplateModal(nombre) {
  var p = null;
  for (var i = 0; i < PLANTILLAS.length; i++) {
    if (PLANTILLAS[i].nombre === nombre) {
      p = PLANTILLAS[i];
      break;
    }
  }
  if (!p) return;
  
  document.getElementById('templateModalTitle').textContent = p.nombre;
  var html = '<span class="template-badge">' + p.badge + '</span><p style="margin:12px 0;color:var(--dark2);font-size:13px">' + p.desc + '</p><div class="template-tags" style="margin-bottom:16px">';
  for (var i = 0; i < p.tags.length; i++) {
    html += '<span class="tag">' + p.tags[i] + '</span>';
  }
  html += '</div><p style="font-size:12px;font-weight:600;color:var(--primary);margin-bottom:8px">Código de ejemplo:</p><div class="code-block"><code>' + p.code.replace(/\n/g,'\n') + '</code></div><a href="' + p.url + '" target="_blank" class="btn-secondary" style="margin-top:16px;display:inline-block">Abrir en Bitbucket →</a>';
  
  document.getElementById('templateModalBody').innerHTML = html;
  document.getElementById('templateModalOverlay').classList.add('active');
}

function closeTemplateModal() {
  document.getElementById('templateModalOverlay').classList.remove('active');
}

// ===============================================
// RENDER: SOLICITAR (servicios pre-aprobados)
// ===============================================
function renderServicios() {
  var grid = document.getElementById('sol-servicesGrid');
  if(!grid) return;
  
  var html = '';
  for (var i = 0; i < SERVICIOS_PREAPROBADOS.length; i++) {
    var s = SERVICIOS_PREAPROBADOS[i];
    var onclickAttr = s.disponible ? 'onclick="quickFill(\'' + s.nombre.replace(/'/g, "\\'") + '\',\'' + s.desc.replace(/'/g, "\\'") + '\')"' : '';
    html += '<div class="sol-card" ' + onclickAttr + '><div class="sol-card-icon"><img src="' + s.icono + '" alt="' + s.nombre + '" onerror="this.style.display=\'none\'"></div><div class="sol-card-name">' + s.nombre + '</div><div class="sol-card-desc">' + s.desc + '</div><span class="sol-bdg ' + (s.disponible ? '' : 'soon') + '">' + (s.disponible ? '⏱️ ' + s.tiempo : s.tiempo) + '</span></div>';
  }
  grid.innerHTML = html;
}

function quickFill(nombre, desc) {
  var nameInput = document.getElementById('sol-serviceName');
  var descInput = document.getElementById('sol-serviceDesc');
  var typeSelect = document.getElementById('sol-serviceType');
  if (nameInput) nameInput.value = nombre;
  if (descInput) descInput.value = desc;
  if (typeSelect) typeSelect.value = 'herramienta';
  var card = document.getElementById('sol-formCard');
  if (card) {
    card.scrollIntoView({behavior:'smooth'});
    card.style.boxShadow = '0 0 0 2px var(--secondary)';
    setTimeout(function(){ card.style.boxShadow = ''; }, 2000);
  }
}

// ===============================================
// SOLICITAR - FORMULARIO PERSONALIZADO
// ===============================================
function submitSolicitar() {
  var sType = document.getElementById('sol-serviceType').value;
  var sName = document.getElementById('sol-serviceName').value.trim();
  var sDesc = document.getElementById('sol-serviceDesc').value.trim();
  var sEnv = document.getElementById('sol-targetEnv').value;
  var sTeam = document.getElementById('sol-team').value.trim() || 'No especificado';
  var sSpecial = document.getElementById('sol-special').value.trim();
  var email = sTeam.includes('@') ? sTeam : sTeam.replace(/\s/g, '') + '@banco-base.com';
  var fb = document.getElementById('sol-feedback');

  if (!sType || !sName || !sDesc) {
    fb.className = 'feedback error';
    fb.innerHTML = 'Complete todos los campos obligatorios.';
    setTimeout(function(){ fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    nombreServicio: sName,
    tipoSolicitud: sType,
    descripcion: sDesc,
    ambiente: sEnv,
    equipo: sTeam,
    requisitosEspeciales: sSpecial,
    email_solicitante: email,
    fecha: new Date().toISOString()
  };

  // ✅ CORREGIDO: Usar el endpoint correcto
  enviarAlBackend('/autoservicio/solicitud-simple', datos, fb, function() {
    document.getElementById('sol-serviceForm').reset();
  });
}

// ===============================================
// RENDER: AUTOSERVICIO
// ===============================================
function renderAutoservicio() {
  renderCards(AUTOSERVICIO.accesos, 'aut-accesosGrid');
  renderCards(AUTOSERVICIO.infra, 'aut-infraGrid');
  renderCards(AUTOSERVICIO.secretos, 'aut-secretosGrid');
}

function renderCards(items, containerId) {
  var container = document.getElementById(containerId);
  if(!container) return;

  // Convertir el contenedor en un carrusel horizontal con flechas.
  container.className = 'carousel';

  var cardsHtml = '';
  for (var i = 0; i < items.length; i++) {
    var s = items[i];
    var iconHtml = (s.icono && (s.icono.indexOf('http://') === 0 || s.icono.indexOf('https://') === 0))
      ? '<img src="' + s.icono + '" alt="' + s.nombre + '" onerror="this.style.display=\'none\'">'
      : s.icono;
    cardsHtml += '<div class="card" onclick="openAutoModal(\'' + s.id + '\')"><div class="card-header"><div class="card-icon">' + iconHtml + '</div><span class="card-badge ' + s.badgeClass + '">' + s.badge + '</span></div><div class="card-title">' + s.nombre + '</div><div class="card-desc">' + s.desc + '</div><div class="card-meta"><span>⏱️ ' + s.tiempo + '</span></div><div class="card-footer"><div class="card-cta">Solicitar →</div></div></div>';
  }

  container.innerHTML =
    '<button type="button" class="carousel-arrow prev" aria-label="Anterior">&#10094;</button>' +
    '<div class="carousel-track">' + cardsHtml + '</div>' +
    '<button type="button" class="carousel-arrow next" aria-label="Siguiente">&#10095;</button>';

  setupCarousel(container);
}

// Inicializa flechas, scroll suave y auto-oculta flechas si no hay overflow.
function setupCarousel(wrapper) {
  var track = wrapper.querySelector('.carousel-track');
  var prev  = wrapper.querySelector('.carousel-arrow.prev');
  var next  = wrapper.querySelector('.carousel-arrow.next');
  if (!track || !prev || !next) return;

  function stepSize() {
    var card = track.querySelector('.card');
    if (!card) return 320;
    // avanzar/retroceder aprox. 1 card (ancho + gap)
    return card.offsetWidth + 20;
  }

  function scrollDir(dir) {
    track.scrollBy({ left: dir * stepSize(), behavior: 'smooth' });
  }

  function updateArrows() {
    var maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 2) {
      // Todo el contenido cabe — ocultar flechas.
      prev.style.display = 'none';
      next.style.display = 'none';
      return;
    }
    prev.style.display = '';
    next.style.display = '';
    prev.toggleAttribute('disabled', track.scrollLeft <= 2);
    next.toggleAttribute('disabled', track.scrollLeft >= maxScroll - 2);
  }

  prev.addEventListener('click', function() { scrollDir(-1); });
  next.addEventListener('click', function() { scrollDir(1); });
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);

  // Esperar a que las imágenes de las cards midan correctamente
  setTimeout(updateArrows, 150);
  // Re-check cuando terminen de cargar los íconos
  var imgs = track.querySelectorAll('img');
  for (var i = 0; i < imgs.length; i++) {
    imgs[i].addEventListener('load', updateArrows, { once: true });
  }
}

function openAutoModal(id) {
  var allItems = [];
  for (var key in AUTOSERVICIO) {
    if (AUTOSERVICIO.hasOwnProperty(key)) {
      var arr = AUTOSERVICIO[key];
      for (var i = 0; i < arr.length; i++) {
        allItems.push(arr[i]);
      }
    }
  }
  
  var s = null;
  for (var i = 0; i < allItems.length; i++) {
    if (allItems[i].id === id) {
      s = allItems[i];
      break;
    }
  }
  if (!s) return;
  
  document.getElementById('modalTitle').textContent = 'Solicitar: ' + s.nombre;
  // Grid de 2 columnas. Cada campo ocupa 1 col por defecto; textareas y
  // repeaters ocupan las 2 (`full-width`). Esto evita scroll excesivo.
  var html = '<form id="autForm" onsubmit="return false;"><div class="form-grid modal-form-grid">';

  for (var i = 0; i < s.campos.length; i++) {
    var c = s.campos[i];

    // Attrs comunes (regex, tooltip, rango numérico).
    var patternAttr = c.pattern ? ' pattern="' + c.pattern.replace(/"/g, '&quot;') + '"' : '';
    var titleAttr   = c.title   ? ' title="'   + c.title.replace(/"/g, '&quot;')   + '"' : '';
    var minAttr     = (c.min !== undefined) ? ' min="' + c.min + '"' : '';
    var maxAttr     = (c.max !== undefined) ? ' max="' + c.max + '"' : '';
    var stepAttr    = (c.step !== undefined) ? ' step="' + c.step + '"' : '';
    var requiredAttr = (c.required === false) ? '' : ' required';

    // Placeholder con prefijo "ej:" automático si no empieza con ej:/¿.
    var ph = c.ph || '';
    if (ph && !/^\s*(ej:|¿)/i.test(ph)) ph = 'ej: ' + ph;

    // Columna: 'full' o 'half'. textarea/repeater por defecto full.
    var isWide = (c.type === 'textarea' || c.type === 'repeater');
    var col = c.col || (isWide ? 'full' : 'half');
    var colClass = (col === 'full') ? ' full-width' : '';

    html += '<div class="form-group' + colClass + '"><label class="form-label">' + c.label +
            (requiredAttr ? ' <span class="required">*</span>' : '') + '</label>';

    if (c.type === 'select') {
      html += '<select class="form-select" name="' + c.name + '"' + requiredAttr + '><option value="">Selecciona...</option>';
      for (var j = 0; j < c.opts.length; j++) {
        html += '<option value="' + c.opts[j] + '">' + c.opts[j] + '</option>';
      }
      html += '</select>';
    } else if (c.type === 'textarea') {
      html += '<textarea class="form-textarea" name="' + c.name + '" rows="' + (c.rows || 3) +
              '" placeholder="' + ph + '"' + requiredAttr + patternAttr + titleAttr + '></textarea>';
    } else if (c.type === 'repeater') {
      // Mini-tabla dinámica con filas de sub-campos; se serializa a JSON al submit.
      var hdrs = '';
      for (var k = 0; k < c.fields.length; k++) {
        hdrs += '<div class="rep-h">' + c.fields[k].label + '</div>';
      }
      hdrs += '<div class="rep-h"></div>';
      html += '<div class="repeater" data-name="' + c.name + '" data-fields=\'' +
              JSON.stringify(c.fields).replace(/'/g, '&#39;') + '\'>';
      html += '<div class="rep-head" style="grid-template-columns:' + c.fields.map(function(){return '1fr';}).join(' ') + ' 40px">' + hdrs + '</div>';
      html += '<div class="rep-rows"></div>';
      html += '<button type="button" class="rep-add" aria-label="Agregar fila">+ Agregar</button>';
      html += '</div>';
    } else {
      var inputType = c.type || 'text';
      html += '<input type="' + inputType + '" class="form-input" name="' + c.name +
              '" placeholder="' + ph + '"' + requiredAttr + patternAttr + titleAttr +
              minAttr + maxAttr + stepAttr + '>';
    }

    if (c.hint) html += '<div class="form-hint">' + c.hint + '</div>';
    html += '</div>';
  }

  // Email + submit (ocupan las 2 columnas)
  html += '<div class="form-group full-width"><label class="form-label">Correo para notificación</label>' +
          '<input type="email" class="form-input" name="email" placeholder="ej: tu-correo@banco-base.com"></div>' +
          '<div class="form-group full-width"><button type="submit" class="btn-primary">Enviar solicitud</button></div>' +
          '</div></form><div id="aut-feedback" class="feedback"></div>';
  
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');

  // Inicializar cada repeater: 1 fila inicial, + / x funcionando.
  var repeaters = document.querySelectorAll('#autForm .repeater');
  for (var r = 0; r < repeaters.length; r++) {
    initRepeater(repeaters[r]);
  }

  var form = document.getElementById('autForm');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(form);
    var datos = {};
    for (var pair of formData.entries()) {
      datos[pair[0]] = pair[1];
    }
    // Serializar repeaters a JSON y meterlos en `datos[name]`.
    var reps = form.querySelectorAll('.repeater');
    for (var r = 0; r < reps.length; r++) {
      datos[reps[r].dataset.name] = JSON.stringify(serializeRepeater(reps[r]));
    }
    datos.nombreServicio = s.nombre;
    datos.fecha = new Date().toISOString();
    datos.email_solicitante = formData.get('email') || 'anonimo@banco-base.com';

    var fb = document.getElementById('aut-feedback');
    enviarAlBackend('/autoservicio/solicitud-simple', datos, fb, function() {
      form.reset();
      setTimeout(function(){ closeModal(); }, 3000);
    });
  });

  document.body.style.overflow = 'hidden';
}

// --- Repeater helpers (filas dinámicas para sub-forms como "Discos") -----
function initRepeater(rep) {
  var fields = JSON.parse(rep.dataset.fields);
  var rows   = rep.querySelector('.rep-rows');
  var addBtn = rep.querySelector('.rep-add');

  function addRow() {
    var row = document.createElement('div');
    row.className = 'rep-row';
    row.style.gridTemplateColumns = fields.map(function(){return '1fr';}).join(' ') + ' 40px';
    var html = '';
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var ph = f.ph || '';
      if (ph && !/^\s*(ej:|¿)/i.test(ph)) ph = 'ej: ' + ph;
      var inputType = f.type || 'text';
      var minA = (f.min !== undefined) ? ' min="' + f.min + '"' : '';
      var maxA = (f.max !== undefined) ? ' max="' + f.max + '"' : '';
      var stepA = (f.step !== undefined) ? ' step="' + f.step + '"' : '';
      html += '<input type="' + inputType + '" class="form-input rep-field" data-key="' + f.name +
              '" placeholder="' + ph + '"' + minA + maxA + stepA + '>';
    }
    html += '<button type="button" class="rep-del" aria-label="Quitar">×</button>';
    row.innerHTML = html;
    row.querySelector('.rep-del').addEventListener('click', function() {
      row.remove();
    });
    rows.appendChild(row);
  }

  addBtn.addEventListener('click', addRow);
  addRow();  // una fila inicial
}

function serializeRepeater(rep) {
  var out = [];
  var rows = rep.querySelectorAll('.rep-row');
  for (var i = 0; i < rows.length; i++) {
    var item = {};
    var inputs = rows[i].querySelectorAll('.rep-field');
    var anyValue = false;
    for (var j = 0; j < inputs.length; j++) {
      var v = inputs[j].value.trim();
      item[inputs[j].dataset.key] = v;
      if (v) anyValue = true;
    }
    if (anyValue) out.push(item);
  }
  return out;
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// Event listeners para cerrar modales
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});
document.getElementById('templateModalOverlay').addEventListener('click', function(e) {
  if (e.target === document.getElementById('templateModalOverlay')) closeTemplateModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
    closeTemplateModal();
  }
});

// ===============================================
// DESPLIEGUE
// ===============================================
function submitDeploy() {
  var app = document.getElementById('dep-application') ? document.getElementById('dep-application').value.trim() : '';
  var repo = document.getElementById('dep-repo') ? document.getElementById('dep-repo').value.trim() : '';
  var branch = document.getElementById('dep-branch') ? document.getElementById('dep-branch').value.trim() : '';
  var env = document.getElementById('dep-environment') ? document.getElementById('dep-environment').value : '';
  var sum = document.getElementById('dep-summary') ? document.getElementById('dep-summary').value.trim() : '';
  var desc = document.getElementById('dep-description') ? document.getElementById('dep-description').value.trim() : '';
  var fb = document.getElementById('dep-feedback');

  if (!app || !repo || !branch || !sum) {
    if(fb) { fb.className = 'feedback error'; fb.innerHTML = '❌ Completa todos los campos obligatorios.'; setTimeout(function(){ fb.className = 'feedback'; }, 3000); }
    return;
  }

  var datos = {
    nombreServicio: 'Despliegue ' + app,
    aplicacion: app,
    repositorio: repo,
    rama: branch,
    ambiente: env,
    resumen: sum,
    descripcion: desc || '',
    email_solicitante: 'despliegue@banco-base.com',
    fecha: new Date().toISOString()
  };

  enviarAlBackend('/autoservicio/solicitud-simple', datos, fb, function() {
    var fields = ['dep-application','dep-repo','dep-branch','dep-summary','dep-description'];
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i]);
      if (el) el.value = '';
    }
  });
}

// ===============================================
// FORMULARIO DEL CATÁLOGO
// ===============================================
function submitForm(fbId, formId) {
  var form = document.getElementById(formId);
  if (!form || !form.checkValidity()) {
    if(form) form.reportValidity();
    return;
  }

  var tipo = document.getElementById('cat-requestType').value;
  var nombre = document.getElementById('cat-serviceName').value.trim();
  var descripcion = document.getElementById('cat-serviceDesc').value.trim();
  var equipo = document.getElementById('cat-team').value.trim() || 'No especificado';
  var email = equipo.includes('@') ? equipo : equipo.replace(/\s/g, '') + '@banco-base.com';

  var fb = document.getElementById(fbId);
  var datos = {
    nombreServicio: nombre,
    tipoSolicitud: tipo,
    descripcion: descripcion,
    equipo: equipo,
    email_solicitante: email,
    fecha: new Date().toISOString()
  };

  // ✅ CORREGIDO: Usar el endpoint correcto
  enviarAlBackend('/autoservicio/solicitud-simple', datos, fb, function() {
    form.reset();
  });
}

// ===============================================
// GUÍAS
// ===============================================
var GD = {
  onprem:[
    {id:'g1',cat:'k8s',t:'Despliegue en Kubernetes On-Prem',d:'Pipeline completo desde Bitbucket hasta K8s local con Jenkins y Argo CD.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg',min:'25 min',lvl:'Intermedio',c:'<h4>Requisitos previos</h4><ul><li>kubectl configurado contra el clúster On-Prem</li><li>Jenkins con permisos al clúster</li><li>Repositorio Bitbucket con Jenkinsfile</li></ul><h4>Flujo</h4><div class="g-flow"><div class="gf-step">Push Bitbucket</div><div class="gf-arr">></div><div class="gf-step">Webhook Jenkins</div><div class="gf-arr">></div><div class="gf-step">Build+Test</div><div class="gf-arr">></div><div class="gf-step">Push Harbor</div><div class="gf-arr">></div><div class="gf-step">kubectl apply</div></div><h4>Jenkinsfile</h4><div class="code-block">pipeline { agent any stages { stage(Checkout) { steps { git branch: main, url: "https://bitbucket.banco-base.com/app.git" } } stage(Build) { steps { sh "docker build -t app:$BUILD_NUMBER ." } } stage(Push) { steps { sh "docker push harbor.banco-base.com/apps/app:$BUILD_NUMBER" } } stage(Deploy) { steps { sh "kubectl set image deployment/app app=harbor.banco-base.com/apps/app:$BUILD_NUMBER -n dev" sh "kubectl rollout status deployment/app -n dev" } } } }</div><button class="g-dl-btn">Descargar PDF</button>'},
    {id:'g2',cat:'jenkins',t:'Pipeline CI/CD con Jenkins',d:'Pipelines declarativos en Jenkins para despliegues en servidores On-Premise.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg',min:'20 min',lvl:'Basico',c:'<h4>Requisitos previos</h4><ul><li>Acceso a Jenkins con credenciales</li><li>Repo con Jenkinsfile en la raíz</li><li>Agente Jenkins con Docker instalado</li></ul><h4>Jenkinsfile declarativo</h4><div class="code-block">pipeline { agent { label "docker" } environment { REGISTRY="harbor.banco-base.com"; APP="mi-app" } stages { stage(Test) { steps { sh "npm test" } } stage(Build) { steps { sh "docker build -t $REGISTRY/$APP:$BUILD_NUMBER ." } } stage(Push) { steps { sh "docker push $REGISTRY/$APP:$BUILD_NUMBER" } } stage(Deploy) { steps { sh "kubectl set image deployment/$APP $APP=$REGISTRY/$APP:$BUILD_NUMBER -n dev" } } } }</div><button class="g-dl-btn">Descargar PDF</button>'},
    {id:'g3',cat:'database',t:'PostgreSQL en Kubernetes On-Prem',d:'Despliegue de PostgreSQL con persistencia y backups automáticos.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',min:'30 min',lvl:'Intermedio',c:'<h4>Requisitos previos</h4><ul><li>Clúster K8s On-Prem activo</li><li>StorageClass configurada</li></ul><h4>Manifiesto PVC + Deployment</h4><div class="code-block">apiVersion: v1\nkind: PersistentVolumeClaim\nmetadata: { name: postgres-pvc, namespace: databases }\nspec: accessModes: [ReadWriteOnce] resources: { requests: { storage: 50Gi } }\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata: { name: postgres, namespace: databases }\nspec: replicas: 1 selector: { matchLabels: { app: postgres } } template: spec: containers: - name: postgres image: postgres:16 env: - name: POSTGRES_PASSWORD valueFrom: { secretKeyRef: { name: postgres-secret, key: password } } volumeMounts: - { name: data, mountPath: /var/lib/postgresql/data } volumes: - name: data persistentVolumeClaim: { claimName: postgres-pvc }</div><button class="g-dl-btn">Descargar PDF</button>'}
  ],
  cloud:[
    {id:'g4',cat:'aws',t:'Despliegue en AWS EKS',d:'Crea un clúster EKS y despliega tu primera aplicación con Terraform y kubectl.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg',min:'35 min',lvl:'Avanzado',c:'<h4>Requisitos</h4><ul><li>Cuenta AWS con permisos EKS, EC2, IAM</li><li>AWS CLI + Terraform v1.5+ + kubectl</li></ul><h4>Flujo</h4><div class="g-flow"><div class="gf-step">terraform plan</div><div class="gf-arr">></div><div class="gf-step">AWS EKS</div><div class="gf-arr">></div><div class="gf-step">kubeconfig</div><div class="gf-arr">></div><div class="gf-step">kubectl apply</div></div><h4>main.tf</h4><div class="code-block">module "eks" { source = "terraform-aws-modules/eks/aws" version = "19.15.0" cluster_name = "banco-base-prod" cluster_version = "1.28" vpc_id = module.vpc.vpc_id subnet_ids = module.vpc.private_subnets eks_managed_node_groups = { main = { min_size=2; max_size=6; desired_size=3; instance_types=["t3.medium"] } } }</div><button class="g-dl-btn">Descargar PDF</button>'},
    {id:'g5',cat:'terraform',t:'Infraestructura como Código con Terraform',d:'Gestiona infraestructura cloud en AWS con módulos Terraform y state remoto en S3.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg',min:'30 min',lvl:'Intermedio',c:'<h4>Requisitos</h4><ul><li>Cuenta AWS activa</li><li>Terraform v1.5+</li><li>Bucket S3 para state remoto</li></ul><h4>backend.tf</h4><div class="code-block">terraform { backend "s3" { bucket = "terraform-state-banco-base" key = "prod/terraform.tfstate" region = "us-east-1" dynamodb_table = "terraform-locks" encrypt = true } }</div><button class="g-dl-btn">Descargar PDF</button>'},
    {id:'g6',cat:'cicd',t:'CI/CD con Bitbucket Pipelines',d:'Automatiza despliegues en Cloud usando Bitbucket Pipelines y credenciales OIDC.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bitbucket/bitbucket-original.svg',min:'20 min',lvl:'Basico',c:'<h4>Requisitos</h4><ul><li>Repo en Bitbucket</li><li>Variables configuradas en el repo</li></ul><h4>bitbucket-pipelines.yml</h4><div class="code-block">pipelines: branches: main: - step: name: Build services: [docker] script: - docker build -t $REGISTRY/$APP:$BITBUCKET_BUILD_NUMBER . - docker push $REGISTRY/$APP:$BITBUCKET_BUILD_NUMBER - step: name: Deploy K8s script: - aws eks update-kubeconfig --name banco-base-prod - kubectl set image deployment/$APP $APP=$REGISTRY/$APP:$BITBUCKET_BUILD_NUMBER</div><button class="g-dl-btn">Descargar PDF</button>'}
  ],
  plataforma:[
    {id:'g7',cat:'harbor',t:'Gestión de imágenes con Harbor',d:'Publica, escanea y gestiona imágenes Docker en el registry privado de Banco BASE.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',min:'20 min',lvl:'Basico',c:'<h4>Login y push de imágenes</h4><div class="code-block">docker login harbor.banco-base.com -u tu-usuario\ndocker tag mi-app:latest harbor.banco-base.com/mi-proyecto/mi-app:1.0.0\ndocker push harbor.banco-base.com/mi-proyecto/mi-app:1.0.0\n\n# Secret para K8s\nkubectl create secret docker-registry harbor-creds --docker-server=harbor.banco-base.com --docker-username=tu-usuario --docker-password=tu-token -n mi-namespace</div><button class="g-dl-btn">Descargar PDF</button>'},
    {id:'g8',cat:'vault',t:'Gestión de secretos con Vault',d:'Almacena y recupera secretos de forma segura desde tus aplicaciones y pipelines.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vault/vault-original.svg',min:'25 min',lvl:'Intermedio',c:'<h4>Guardar y leer secretos</h4><div class="code-block">vault login -method=token $VAULT_TOKEN\nvault kv put secret/mi-app/prod db_password="super-secreto" api_key="abc123"\nvault kv get secret/mi-app/prod</div><h4>Vault Agent en K8s</h4><div class="code-block">annotations: vault.hashicorp.com/agent-inject: "true" vault.hashicorp.com/role: "mi-app" vault.hashicorp.com/agent-inject-secret-config: "secret/mi-app/prod"</div><button class="g-dl-btn">Descargar PDF</button>'},
    {id:'g9',cat:'monitoring',t:'Monitoreo con Prometheus + Grafana',d:'Configura métricas, alertas y dashboards para tus apps en Kubernetes.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg',min:'30 min',lvl:'Intermedio',c:'<h4>Exponer métricas desde Node.js</h4><div class="code-block">const client = require("prom-client"); const counter = new client.Counter({ name: "http_requests_total", help: "Total de requests HTTP", labelNames: ["method", "status"] }); app.get("/metrics", async (req, res) => { res.set("Content-Type", client.register.contentType); res.end(await client.register.metrics()); });</div><button class="g-dl-btn">Descargar PDF</button>'},
    {id:'g10',cat:'sonar',t:'Análisis de código con SonarQube',d:'Integra SonarQube en tu pipeline Jenkins para análisis de calidad y seguridad.',i:'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sonarqube/sonarqube-original.svg',min:'20 min',lvl:'Basico',c:'<h4>Stage en Jenkinsfile</h4><div class="code-block">stage("SonarQube") { steps { withSonarQubeEnv("SonarQube") { sh "sonar-scanner -Dsonar.projectKey=mi-app -Dsonar.sources=src" } } } stage("Quality Gate") { steps { timeout(time:5, unit:"MINUTES") { waitForQualityGate abortPipeline: true } } }</div><button class="g-dl-btn">Descargar PDF</button>'}
  ]
};

function renderGList(cid, items) {
  var cont = document.getElementById(cid);
  if(!cont) return;
  var lvlClass = {'Basico':'basic','Intermedio':'','Avanzado':'adv'};
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var g = items[i];
    html += '<div class="g-item"><div class="g-hdr" onclick="toggleG(\'' + g.id + '\')"><div class="g-trow"><div class="g-logo"><img src="' + g.i + '" alt="' + g.t + '" onerror="this.style.display=\'none\'"></div><div class="g-info"><h3>' + g.t + '</h3><p>' + g.d + '</p></div></div><div class="g-meta"><span class="g-time">' + g.min + '</span><span class="g-pill ' + (lvlClass[g.lvl]||'') + '">' + g.lvl + '</span><span class="g-chev" id="gc-' + g.id + '">▼</span></div></div><div class="g-body" id="gb-' + g.id + '">' + g.c + '</div></div>';
  }
  cont.innerHTML = html;
}

function renderAllGuides() {
  renderGList('gl-onprem', GD.onprem);
  renderGList('gl-cloud', GD.cloud);
  renderGList('gl-plataforma', GD.plataforma);
}

function toggleG(id) {
  var body = document.getElementById('gb-'+id);
  var chev = document.getElementById('gc-'+id);
  if(body) body.classList.toggle('open');
  if(chev) chev.classList.toggle('open');
}

function switchGTab(tab, btn) {
  var tabs = document.querySelectorAll('.g-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
  }
  var panels = document.querySelectorAll('.g-panel');
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove('active');
  }
  btn.classList.add('active');
  document.getElementById('gp-'+tab).classList.add('active');
}

function filterG(section, cat, btn) {
  var btns = document.querySelectorAll('#gf-'+section+' .filter-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.remove('active');
  }
  btn.classList.add('active');
  var items = cat === 'all' ? GD[section] : [];
  if (cat !== 'all') {
    for (var i = 0; i < GD[section].length; i++) {
      if (GD[section][i].cat === cat) {
        items.push(GD[section][i]);
      }
    }
  }
  renderGList('gl-'+section, items);
}
// ===============================================
// AUTOSERVICIO - SOLICITUD SIMPLE
// ===============================================
function submitAutoservicioSimple() {
  var nombre = document.getElementById('auto-nombre') ? document.getElementById('auto-nombre').value.trim() : '';
  var descripcion = document.getElementById('auto-descripcion') ? document.getElementById('auto-descripcion').value.trim() : '';
  var ambiente = document.getElementById('auto-ambiente') ? document.getElementById('auto-ambiente').value : 'dev';
  var email = document.getElementById('auto-email') ? document.getElementById('auto-email').value.trim() : '';
  var fb = document.getElementById('auto-feedback');

  if (!nombre || !descripcion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete: nombre, descripción, email';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    nombreServicio: nombre,
    descripcion: descripcion,
    ambiente: ambiente || 'dev',
    email_solicitante: email
  };

  enviarAlBackend('/autoservicio/solicitud-simple', datos, fb, function() {
    var form = document.getElementById('auto-form-simple');
    if (form) form.reset();
  });
}

// ===============================================
// AUTOSERVICIO - VM CLOUD
// ===============================================
function submitAutoservicioVM() {
  var nombre = document.getElementById('auto-vm-nombre') ? document.getElementById('auto-vm-nombre').value.trim() : '';
  var proveedor = document.getElementById('auto-vm-proveedor') ? document.getElementById('auto-vm-proveedor').value : '';
  var region = document.getElementById('auto-vm-region') ? document.getElementById('auto-vm-region').value.trim() : '';
  var tipo = document.getElementById('auto-vm-tipo') ? document.getElementById('auto-vm-tipo').value : '';
  var email = document.getElementById('auto-vm-email') ? document.getElementById('auto-vm-email').value.trim() : '';
  var fb = document.getElementById('auto-vm-feedback');

  if (!nombre || !proveedor || !region || !tipo || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    nombre_vm: nombre,
    proveedor: proveedor,
    region: region,
    tipo_instancia: tipo,
    email_solicitante: email
  };

  enviarAlBackend('/autoservicio/solicitud-vm', datos, fb, function() {
    var form = document.getElementById('auto-form-vm');
    if (form) form.reset();
  });
}

// ===============================================
// AUTOSERVICIO - NAMESPACE KUBERNETES
// ===============================================
function submitAutoservicioNamespace() {
  var nombre = document.getElementById('auto-ns-nombre') ? document.getElementById('auto-ns-nombre').value.trim() : '';
  var ambiente = document.getElementById('auto-ns-ambiente') ? document.getElementById('auto-ns-ambiente').value : '';
  var cpu = document.getElementById('auto-ns-cpu') ? document.getElementById('auto-ns-cpu').value : '1000m';
  var memoria = document.getElementById('auto-ns-memoria') ? document.getElementById('auto-ns-memoria').value : '1Gi';
  var email = document.getElementById('auto-ns-email') ? document.getElementById('auto-ns-email').value.trim() : '';
  var fb = document.getElementById('auto-ns-feedback');

  if (!nombre || !ambiente || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete: nombre namespace, ambiente, email';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    nombre_namespace: nombre,
    ambiente: ambiente,
    cpu_limite: cpu,
    memoria_limite: memoria,
    email_solicitante: email
  };

  enviarAlBackend('/autoservicio/solicitud-namespace', datos, fb, function() {
    var form = document.getElementById('auto-form-ns');
    if (form) form.reset();
  });
}

// ===============================================
// HERRAMIENTAS - JENKINS
// ===============================================
function submitHerramientasJenkins() {
  var usuario = document.getElementById('tool-jenkins-user') ? document.getElementById('tool-jenkins-user').value.trim() : '';
  var rol = document.getElementById('tool-jenkins-role') ? document.getElementById('tool-jenkins-role').value : '';
  var instancia = document.getElementById('tool-jenkins-instance') ? document.getElementById('tool-jenkins-instance').value.trim() : '';
  var justificacion = document.getElementById('tool-jenkins-justif') ? document.getElementById('tool-jenkins-justif').value.trim() : '';
  var email = document.getElementById('tool-jenkins-email') ? document.getElementById('tool-jenkins-email').value.trim() : '';
  var fb = document.getElementById('tool-jenkins-feedback');

  if (!usuario || !rol || !instancia || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    usuario: usuario,
    rol: rol,
    instancia: instancia,
    justificacion: justificacion,
    email_solicitante: email,
    nombreServicio: 'Jenkins'
  };

  enviarAlBackend('/herramientas/jenkins/acceso', datos, fb, function() {
    var form = document.getElementById('tool-form-jenkins');
    if (form) form.reset();
  });
}

// ===============================================
// HERRAMIENTAS - BITBUCKET
// ===============================================
function submitHerramientasBitbucket() {
  var usuario = document.getElementById('tool-bb-user') ? document.getElementById('tool-bb-user').value.trim() : '';
  var repositorio = document.getElementById('tool-bb-repo') ? document.getElementById('tool-bb-repo').value.trim() : '';
  var permisos = document.getElementById('tool-bb-perms') ? document.getElementById('tool-bb-perms').value : '';
  var justificacion = document.getElementById('tool-bb-justif') ? document.getElementById('tool-bb-justif').value.trim() : '';
  var email = document.getElementById('tool-bb-email') ? document.getElementById('tool-bb-email').value.trim() : '';
  var fb = document.getElementById('tool-bb-feedback');

  if (!usuario || !repositorio || !permisos || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    usuario: usuario,
    repositorio: repositorio,
    permisos: [permisos],
    justificacion: justificacion,
    email_solicitante: email,
    nombreServicio: 'Bitbucket'
  };

  enviarAlBackend('/herramientas/bitbucket/acceso', datos, fb, function() {
    var form = document.getElementById('tool-form-bitbucket');
    if (form) form.reset();
  });
}

// ===============================================
// HERRAMIENTAS - ARGOCD
// ===============================================
function submitHerramientasArgoCD() {
  var namespace = document.getElementById('tool-argocd-ns') ? document.getElementById('tool-argocd-ns').value.trim() : '';
  var ambiente = document.getElementById('tool-argocd-env') ? document.getElementById('tool-argocd-env').value : '';
  var aplicacion = document.getElementById('tool-argocd-app') ? document.getElementById('tool-argocd-app').value.trim() : '';
  var justificacion = document.getElementById('tool-argocd-justif') ? document.getElementById('tool-argocd-justif').value.trim() : '';
  var email = document.getElementById('tool-argocd-email') ? document.getElementById('tool-argocd-email').value.trim() : '';
  var fb = document.getElementById('tool-argocd-feedback');

  if (!namespace || !ambiente || !aplicacion || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    namespace: namespace,
    ambiente: ambiente,
    aplicacion: aplicacion,
    justificacion: justificacion,
    email_solicitante: email,
    nombreServicio: 'ArgoCD'
  };

  enviarAlBackend('/herramientas/argocd/app', datos, fb, function() {
    var form = document.getElementById('tool-form-argocd');
    if (form) form.reset();
  });
}

// ===============================================
// HERRAMIENTAS - KUBERNETES RBAC
// ===============================================
function submitHerramientasKubernetes() {
  var usuario = document.getElementById('tool-k8s-user') ? document.getElementById('tool-k8s-user').value.trim() : '';
  var cluster = document.getElementById('tool-k8s-cluster') ? document.getElementById('tool-k8s-cluster').value.trim() : '';
  var namespace = document.getElementById('tool-k8s-ns') ? document.getElementById('tool-k8s-ns').value.trim() : '';
  var justificacion = document.getElementById('tool-k8s-justif') ? document.getElementById('tool-k8s-justif').value.trim() : '';
  var email = document.getElementById('tool-k8s-email') ? document.getElementById('tool-k8s-email').value.trim() : '';
  var fb = document.getElementById('tool-k8s-feedback');

  if (!usuario || !cluster || !namespace || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    usuario: usuario,
    cluster: cluster,
    namespace: namespace,
    justificacion: justificacion,
    email_solicitante: email,
    nombreServicio: 'Kubernetes'
  };

  enviarAlBackend('/herramientas/kubernetes/acceso', datos, fb, function() {
    var form = document.getElementById('tool-form-k8s');
    if (form) form.reset();
  });
}

// ===============================================
// HERRAMIENTAS - SONARQUBE
// ===============================================
function submitHerramientasSonarQube() {
  var proyecto = document.getElementById('tool-sq-proj') ? document.getElementById('tool-sq-proj').value.trim() : '';
  var rama = document.getElementById('tool-sq-branch') ? document.getElementById('tool-sq-branch').value.trim() : '';
  var lenguaje = document.getElementById('tool-sq-lang') ? document.getElementById('tool-sq-lang').value : '';
  var justificacion = document.getElementById('tool-sq-justif') ? document.getElementById('tool-sq-justif').value.trim() : '';
  var email = document.getElementById('tool-sq-email') ? document.getElementById('tool-sq-email').value.trim() : '';
  var fb = document.getElementById('tool-sq-feedback');

  if (!proyecto || !rama || !lenguaje || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    proyecto: proyecto,
    rama: rama,
    lenguaje: lenguaje,
    justificacion: justificacion,
    email_solicitante: email,
    nombreServicio: 'SonarQube'
  };

  enviarAlBackend('/herramientas/sonarqube/proyecto', datos, fb, function() {
    var form = document.getElementById('tool-form-sq');
    if (form) form.reset();
  });
}

// ===============================================
// HERRAMIENTAS - GRAFANA
// ===============================================
function submitHerramientasGrafana() {
  var dashboard = document.getElementById('tool-graf-dash') ? document.getElementById('tool-graf-dash').value.trim() : '';
  var metricas = document.getElementById('tool-graf-metrics') ? document.getElementById('tool-graf-metrics').value.trim() : '';
  var dataSource = document.getElementById('tool-graf-ds') ? document.getElementById('tool-graf-ds').value.trim() : '';
  var justificacion = document.getElementById('tool-graf-justif') ? document.getElementById('tool-graf-justif').value.trim() : '';
  var email = document.getElementById('tool-graf-email') ? document.getElementById('tool-graf-email').value.trim() : '';
  var fb = document.getElementById('tool-graf-feedback');

  if (!dashboard || !metricas || !dataSource || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    dashboard: dashboard,
    metricas: metricas.split(',').map(function(m) { return m.trim(); }),
    dataSource: dataSource,
    justificacion: justificacion,
    email_solicitante: email,
    nombreServicio: 'Grafana'
  };

  enviarAlBackend('/herramientas/grafana/dashboard', datos, fb, function() {
    var form = document.getElementById('tool-form-grafana');
    if (form) form.reset();
  });
}

// ===============================================
// HERRAMIENTAS - HARBOR
// ===============================================
function submitHerramientasHarbor() {
  var usuario = document.getElementById('tool-harbor-user') ? document.getElementById('tool-harbor-user').value.trim() : '';
  var proyecto = document.getElementById('tool-harbor-proj') ? document.getElementById('tool-harbor-proj').value.trim() : '';
  var permisos = document.getElementById('tool-harbor-perms') ? document.getElementById('tool-harbor-perms').value : '';
  var justificacion = document.getElementById('tool-harbor-justif') ? document.getElementById('tool-harbor-justif').value.trim() : '';
  var email = document.getElementById('tool-harbor-email') ? document.getElementById('tool-harbor-email').value.trim() : '';
  var fb = document.getElementById('tool-harbor-feedback');

  if (!usuario || !proyecto || !permisos || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    usuario: usuario,
    proyecto: proyecto,
    permisos: permisos,
    justificacion: justificacion,
    email_solicitante: email,
    nombreServicio: 'Harbor'
  };

  enviarAlBackend('/herramientas/harbor/acceso', datos, fb, function() {
    var form = document.getElementById('tool-form-harbor');
    if (form) form.reset();
  });
}

// ===============================================
// HERRAMIENTAS - VAULT
// ===============================================
function submitHerramientasVault() {
  var path = document.getElementById('tool-vault-path') ? document.getElementById('tool-vault-path').value.trim() : '';
  var secretos = document.getElementById('tool-vault-secrets') ? document.getElementById('tool-vault-secrets').value.trim() : '';
  var justificacion = document.getElementById('tool-vault-justif') ? document.getElementById('tool-vault-justif').value.trim() : '';
  var email = document.getElementById('tool-vault-email') ? document.getElementById('tool-vault-email').value.trim() : '';
  var fb = document.getElementById('tool-vault-feedback');

  if (!path || !secretos || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    path: path,
    secretos: secretos.split(',').map(function(s) { return s.trim(); }),
    justificacion: justificacion,
    email_solicitante: email,
    nombreServicio: 'Vault'
  };

  enviarAlBackend('/herramientas/vault/secrets', datos, fb, function() {
    var form = document.getElementById('tool-form-vault');
    if (form) form.reset();
  });
}

// ===============================================
// SOLICITUDES - NUEVA HERRAMIENTA
// ===============================================
function submitSolicitudHerramienta() {
  var nombreHerr = document.getElementById('sol-herr-nombre') ? document.getElementById('sol-herr-nombre').value.trim() : '';
  var descripcion = document.getElementById('sol-herr-desc') ? document.getElementById('sol-herr-desc').value.trim() : '';
  var razon = document.getElementById('sol-herr-razon') ? document.getElementById('sol-herr-razon').value.trim() : '';
  var enlaces = document.getElementById('sol-herr-enlaces') ? document.getElementById('sol-herr-enlaces').value.trim() : '';
  var presupuesto = document.getElementById('sol-herr-presup') ? document.getElementById('sol-herr-presup').value.trim() : '';
  var email = document.getElementById('sol-herr-email') ? document.getElementById('sol-herr-email').value.trim() : '';
  var fb = document.getElementById('sol-herr-feedback');

  if (!nombreHerr || !descripcion || !razon || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete: nombre, descripción, razón, email';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    nombreHerramienta: nombreHerr,
    descripcion: descripcion,
    razon: razon,
    enlaces: enlaces || 'N/A',
    presupuesto: presupuesto || 'N/A',
    email_solicitante: email
  };

  enviarAlBackend('/solicitudes/herramienta', datos, fb, function() {
    var form = document.getElementById('sol-form-herr');
    if (form) form.reset();
  });
}

// ===============================================
// SOLICITUDES - CONTENEDOR DOCKER
// ===============================================
function submitSolicitudContenedor() {
  var nombreCont = document.getElementById('sol-cont-nombre') ? document.getElementById('sol-cont-nombre').value.trim() : '';
  var baseImage = document.getElementById('sol-cont-base') ? document.getElementById('sol-cont-base').value.trim() : '';
  var puertos = document.getElementById('sol-cont-puertos') ? document.getElementById('sol-cont-puertos').value.trim() : '';
  var volumenes = document.getElementById('sol-cont-volumes') ? document.getElementById('sol-cont-volumes').value.trim() : '';
  var variables = document.getElementById('sol-cont-vars') ? document.getElementById('sol-cont-vars').value.trim() : '';
  var justificacion = document.getElementById('sol-cont-justif') ? document.getElementById('sol-cont-justif').value.trim() : '';
  var email = document.getElementById('sol-cont-email') ? document.getElementById('sol-cont-email').value.trim() : '';
  var fb = document.getElementById('sol-cont-feedback');

  if (!nombreCont || !baseImage || !justificacion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete: nombre, imagen base, justificación, email';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    nombreContenedor: nombreCont,
    baseImage: baseImage,
    puertos: puertos ? puertos.split(',').map(function(p) { return p.trim(); }) : [],
    volumenes: volumenes ? volumenes.split(',').map(function(v) { return v.trim(); }) : [],
    variables: variables ? variables.split(',').map(function(v) { return v.trim(); }) : [],
    justificacion: justificacion,
    email_solicitante: email
  };

  enviarAlBackend('/solicitudes/contenedor', datos, fb, function() {
    var form = document.getElementById('sol-form-cont');
    if (form) form.reset();
  });
}

// ===============================================
// SOLICITUDES - INFRAESTRUCTURA
// ===============================================
function submitSolicitudInfraestructura() {
  var tipoInfra = document.getElementById('sol-infra-tipo') ? document.getElementById('sol-infra-tipo').value : '';
  var descripcion = document.getElementById('sol-infra-desc') ? document.getElementById('sol-infra-desc').value.trim() : '';
  var especificaciones = document.getElementById('sol-infra-specs') ? document.getElementById('sol-infra-specs').value.trim() : '';
  var ambiente = document.getElementById('sol-infra-env') ? document.getElementById('sol-infra-env').value : '';
  var dependencias = document.getElementById('sol-infra-deps') ? document.getElementById('sol-infra-deps').value.trim() : '';
  var timeline = document.getElementById('sol-infra-timeline') ? document.getElementById('sol-infra-timeline').value.trim() : '';
  var email = document.getElementById('sol-infra-email') ? document.getElementById('sol-infra-email').value.trim() : '';
  var fb = document.getElementById('sol-infra-feedback');

  if (!tipoInfra || !descripcion || !especificaciones || !ambiente || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete: tipo, descripción, especificaciones, ambiente, email';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    tipoInfraestructura: tipoInfra,
    descripcion: descripcion,
    especificaciones: especificaciones,
    ambiente: ambiente,
    dependencias: dependencias || 'N/A',
    timeline: timeline || 'N/A',
    email_solicitante: email
  };

  enviarAlBackend('/solicitudes/infraestructura', datos, fb, function() {
    var form = document.getElementById('sol-form-infra');
    if (form) form.reset();
  });
}

// ===============================================
// SOLICITUDES - AUTOMATIZACIÓN
// ===============================================
function submitSolicitudAutomatizacion() {
  var nombrePipe = document.getElementById('sol-auto-nombre') ? document.getElementById('sol-auto-nombre').value.trim() : '';
  var tipo = document.getElementById('sol-auto-tipo') ? document.getElementById('sol-auto-tipo').value : '';
  var descripcion = document.getElementById('sol-auto-desc') ? document.getElementById('sol-auto-desc').value.trim() : '';
  var triggers = document.getElementById('sol-auto-triggers') ? document.getElementById('sol-auto-triggers').value.trim() : '';
  var etapas = document.getElementById('sol-auto-etapas') ? document.getElementById('sol-auto-etapas').value.trim() : '';
  var documentacion = document.getElementById('sol-auto-docs') ? document.getElementById('sol-auto-docs').value.trim() : '';
  var email = document.getElementById('sol-auto-email') ? document.getElementById('sol-auto-email').value.trim() : '';
  var fb = document.getElementById('sol-auto-feedback');

  if (!nombrePipe || !tipo || !descripcion || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete: nombre, tipo, descripción, email';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    nombrePipeline: nombrePipe,
    tipo: tipo,
    descripcion: descripcion,
    triggers: triggers ? triggers.split(',').map(function(t) { return t.trim(); }) : [],
    etapas: etapas ? etapas.split(',').map(function(e) { return e.trim(); }) : [],
    documentacion: documentacion || 'N/A',
    email_solicitante: email
  };

  enviarAlBackend('/solicitudes/automatizacion', datos, fb, function() {
    var form = document.getElementById('sol-form-auto');
    if (form) form.reset();
  });
}

// ===============================================
// DESPLIEGUE - KUBERNETES
// ===============================================
function submitDespliegueKubernetes() {
  var nombre = document.getElementById('dep-k8s-nombre') ? document.getElementById('dep-k8s-nombre').value.trim() : '';
  var namespace = document.getElementById('dep-k8s-ns') ? document.getElementById('dep-k8s-ns').value.trim() : '';
  var imagen = document.getElementById('dep-k8s-imagen') ? document.getElementById('dep-k8s-imagen').value.trim() : '';
  var replicas = document.getElementById('dep-k8s-replicas') ? document.getElementById('dep-k8s-replicas').value : '3';
  var puerto = document.getElementById('dep-k8s-puerto') ? document.getElementById('dep-k8s-puerto').value : '8080';
  var host = document.getElementById('dep-k8s-host') ? document.getElementById('dep-k8s-host').value.trim() : '';
  var incluirIngress = document.getElementById('dep-k8s-ingress') ? document.getElementById('dep-k8s-ingress').checked : false;
  var incluirHPA = document.getElementById('dep-k8s-hpa') ? document.getElementById('dep-k8s-hpa').checked : false;
  var email = document.getElementById('dep-k8s-email') ? document.getElementById('dep-k8s-email').value.trim() : '';
  var fb = document.getElementById('dep-k8s-feedback');

  if (!nombre || !namespace || !imagen || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete: nombre, namespace, imagen, email';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    nombre: nombre,
    namespace: namespace,
    imagen: imagen,
    replicas: parseInt(replicas),
    puerto: parseInt(puerto),
    host: host || undefined,
    env: [],
    recursos: { cpu: '500m', memoria: '512Mi' },
    incluirIngress: incluirIngress,
    incluirHPA: incluirHPA,
    incluirConfigMap: false,
    rama: 'main',
    repositorio: 'infrastructure',
    email_solicitante: email
  };

  enviarAlBackend('/despliegue/kubernetes', datos, fb, function() {
    var form = document.getElementById('dep-form-k8s');
    if (form) form.reset();
  });
}

// ===============================================
// DESPLIEGUE - JENKINS TRIGGER
// ===============================================
function submitDespliegueJenkins() {
  var jobName = document.getElementById('dep-jen-job') ? document.getElementById('dep-jen-job').value.trim() : '';
  var parametros = document.getElementById('dep-jen-params') ? document.getElementById('dep-jen-params').value.trim() : '';
  var email = document.getElementById('dep-jen-email') ? document.getElementById('dep-jen-email').value.trim() : '';
  var fb = document.getElementById('dep-jen-feedback');

  if (!jobName || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete: nombre job, email';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var parametrosObj = {};
  if (parametros) {
    var params = parametros.split(',');
    for (var i = 0; i < params.length; i++) {
      var pair = params[i].trim().split('=');
      if (pair.length === 2 && pair[0] && pair[1]) {
        parametrosObj[pair[0].trim()] = pair[1].trim();
      }
    }
  }

  var datos = {
    jobName: jobName,
    parametros: parametrosObj,
    variables_entorno: [],
    email_solicitante: email
  };

  enviarAlBackend('/despliegue/jenkins-trigger', datos, fb, function() {
    var form = document.getElementById('dep-form-jen');
    if (form) form.reset();
  });
}

// ===============================================
// DESPLIEGUE - ROLLBACK
// ===============================================
function submitDespliegueRollback() {
  var deployment = document.getElementById('dep-rb-deploy') ? document.getElementById('dep-rb-deploy').value.trim() : '';
  var namespace = document.getElementById('dep-rb-ns') ? document.getElementById('dep-rb-ns').value.trim() : '';
  var previousVersion = document.getElementById('dep-rb-version') ? document.getElementById('dep-rb-version').value.trim() : '';
  var razon = document.getElementById('dep-rb-razon') ? document.getElementById('dep-rb-razon').value.trim() : '';
  var email = document.getElementById('dep-rb-email') ? document.getElementById('dep-rb-email').value.trim() : '';
  var fb = document.getElementById('dep-rb-feedback');

  if (!deployment || !namespace || !previousVersion || !razon || !email) {
    fb.className = 'feedback error';
    fb.innerHTML = '❌ Complete todos los campos requeridos';
    setTimeout(function() { fb.className = 'feedback'; }, 3000);
    return;
  }

  var datos = {
    deployment: deployment,
    namespace: namespace,
    previousVersion: previousVersion,
    razon: razon,
    email_solicitante: email
  };

  enviarAlBackend('/despliegue/rollback', datos, fb, function() {
    var form = document.getElementById('dep-form-rb');
    if (form) form.reset();
  });
}

// ---- SCRIPT DEL CHAT -----------------------------------------
// ═══════════════════════════════════════════════════
// ESTADO DEL CHAT
// ═══════════════════════════════════════════════════
var chatOpen    = false;
var chatLoading = false;
var chatHistory = [];     // historial de mensajes para contexto
var iaOnline    = false;
var guideActive = false;

// ═══════════════════════════════════════════════════
// TOGGLE DEL CHAT
// ═══════════════════════════════════════════════════
function chatToggle() {
  chatOpen = !chatOpen;
  var box = document.getElementById('chat-box');
  if (chatOpen) {
    box.classList.add('open');
    document.getElementById('fab-badge').classList.remove('visible');
    document.getElementById('chat-input').focus();
  } else {
    box.classList.remove('open');
    clearGuide();
  }
}

// ═══════════════════════════════════════════════════
// VERIFICAR ESTADO DE LA IA AL CARGAR
// ═══════════════════════════════════════════════════
function checkIAStatus() {
  fetch('/api/chat/estado')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var dot   = document.getElementById('ia-status');
      var label = document.getElementById('ia-status-label');
      if (data.disponible) {
        dot.classList.add('online');
        label.textContent = 'IA lista';
        iaOnline = true;
      } else {
        label.textContent = 'IA iniciando...';
        // Reintentar cada 15s hasta que esté disponible
        setTimeout(checkIAStatus, 15000);
      }
    })
    .catch(function() {
      document.getElementById('ia-status-label').textContent = 'IA no disponible';
      setTimeout(checkIAStatus, 20000);
    });
}
checkIAStatus();

// ═══════════════════════════════════════════════════
// AÑADIR MENSAJE AL CHAT
// ═══════════════════════════════════════════════════
function chatAppend(text, role, extraHTML) {
  var msgs = document.getElementById('chat-messages');
  var div = document.createElement('div');
  div.className = 'cm cm-' + role;
  div.textContent = text;
  if (extraHTML) div.innerHTML += extraHTML;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

// ═══════════════════════════════════════════════════
// ENVIAR MENSAJE (chip de sugerencia)
// ═══════════════════════════════════════════════════
function chatSuggestion(text) {
  document.getElementById('chat-input').value = text;
  chatSend();
}

// ═══════════════════════════════════════════════════
// ENVIAR MENSAJE PRINCIPAL
// ═══════════════════════════════════════════════════
function chatSend() {
  if (chatLoading) return;
  var input = document.getElementById('chat-input');
  var text  = input.value.trim();
  if (!text) return;

  input.value = '';
  chatLoading = true;

  // Mostrar mensaje del usuario
  chatAppend(text, 'user');
  chatHistory.push({ role: 'user', content: text });

  // Indicador de escritura
  var typing = chatAppend('Analizando tu solicitud...', 'bot');
  typing.classList.add('typing');

  // Deshabilitar botón
  document.getElementById('chat-send').disabled = true;
  // Ocultar sugerencias tras primer envío
  document.getElementById('chat-suggestions').style.display = 'none';

  // Llamar al backend
  fetch('/api/chat', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ messages: chatHistory })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    typing.remove();
    chatLoading = false;
    document.getElementById('chat-send').disabled = false;

    if (!data.success) {
      chatAppend('Lo siento, ocurrió un error. Intenta de nuevo.', 'bot');
      return;
    }

    // Guardar respuesta en historial
    chatHistory.push({ role: 'assistant', content: data.texto });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    // Construir botón de acción si hay navegación
    var actionHTML = '';
    if (data.accion === 'navegar' && data.seccion) {
      var label = data.modal_id
        ? 'Ir al formulario →'
        : 'Ver sección →';
      actionHTML = '<br><button class="cm-action-btn" onclick="chatEjecutarAccion(\'' +
        data.seccion + '\',\'' + (data.modal_id || '') + '\',' +
        JSON.stringify(data.guia_campos || null).replace(/"/g, '&quot;') +
        ')">' +
        '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' +
        label + '</button>';
    }

    chatAppend(data.texto, 'bot', actionHTML);

    // Notificación si el chat está cerrado
    if (!chatOpen) {
      document.getElementById('fab-badge').classList.add('visible');
    }

    // Ejecutar navegación automáticamente si hay intención clara
    if (data.accion === 'navegar' && data.seccion) {
      setTimeout(function() {
        chatEjecutarAccion(data.seccion, data.modal_id || '', data.guia_campos || null);
      }, 800);
    }
  })
  .catch(function() {
    typing.remove();
    chatLoading = false;
    document.getElementById('chat-send').disabled = false;
    chatAppend('Error de conexión. Verifica que el servidor esté corriendo.', 'bot');
  });
}

// ═══════════════════════════════════════════════════
// EJECUTAR NAVEGACIÓN GUIADA
// ═══════════════════════════════════════════════════
function chatEjecutarAccion(seccion, modalId, guiaCampos) {
  // 1. Navegar a la sección
  if (typeof navigate === 'function') {
    navigate(seccion);
  }

  // 2. Abrir el modal si aplica
  if (modalId) {
    setTimeout(function() {
      // Hacer scroll a la sección de autoservicio
      var container = document.getElementById('view-' + seccion);
      if (container) container.scrollTop = 0;

      // Renderizar autoservicio si no se ha hecho
      if (typeof renderAutoservicio === 'function' && !window._autLoaded) {
        renderAutoservicio();
        window._autLoaded = true;
      }

      // Abrir el modal del servicio correspondiente
      if (typeof openAutoModal === 'function') {
        openAutoModal(modalId);
      }

      // 3. Activar guía de campos si hay instrucciones
      if (guiaCampos && guiaCampos.length > 0) {
        setTimeout(function() {
          activarGuiaCampos(guiaCampos);
        }, 600);
      }
    }, 500);
  }
}

// ═══════════════════════════════════════════════════
// GUÍA DE CAMPOS — resalta y explica cada input del modal
// ═══════════════════════════════════════════════════
function activarGuiaCampos(campos) {
  clearGuide();
  guideActive = true;
  var overlay = document.getElementById('guide-overlay');
  overlay.innerHTML = '';

  // Buscar los inputs del modal abierto
  var modal = document.getElementById('autForm');
  if (!modal) return;

  var inputs = modal.querySelectorAll('input, select, textarea');
  var idx    = 0;

  function resaltarSiguiente() {
    if (idx >= inputs.length || idx >= campos.length) {
      // Tour completo — mostrar mensaje final
      setTimeout(clearGuide, 3000);
      return;
    }

    var input  = inputs[idx];
    var config = campos[idx] || { campo: '', descripcion: '' };
    idx++;

    // Resaltar el input
    var rect = input.getBoundingClientRect();
    var highlight = document.createElement('div');
    highlight.className = 'guide-highlight';
    highlight.style.cssText = [
      'top:'    + (rect.top    + window.scrollY - 3) + 'px',
      'left:'   + (rect.left   + window.scrollX - 3) + 'px',
      'width:'  + (rect.width  + 6) + 'px',
      'height:' + (rect.height + 6) + 'px',
    ].join(';');
    overlay.appendChild(highlight);

    // Tooltip con la descripción
    var tip = document.createElement('div');
    tip.className = 'guide-tooltip';
    tip.style.cssText = [
      'top:'  + (rect.top    + window.scrollY + rect.height + 8) + 'px',
      'left:' + (rect.right  + window.scrollX + 10) + 'px',
    ].join(';');
    tip.innerHTML = '<strong>' + config.campo + '</strong><br>' + config.descripcion;
    overlay.appendChild(tip);

    // Hacer foco en el input
    input.focus();

    // Pasar al siguiente campo al hacer clic o tras 3s
    var next = function() {
      overlay.innerHTML = '';
      resaltarSiguiente();
    };
    input.addEventListener('click', next, { once: true });
    setTimeout(next, 3500);
  }

  resaltarSiguiente();
}

function clearGuide() {
  guideActive = false;
  var overlay = document.getElementById('guide-overlay');
  if (overlay) overlay.innerHTML = '';
}

// Limpiar guía al cerrar modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') clearGuide();
});

// ---- EXPOSICIÓN A window para compatibilidad con onclick="..." --------
// Nota: eval() dentro de un módulo ES corre en strict mode con scope
// aislado y NO ve las function declarations del módulo. Por eso las
// asignamos directamente. Lista derivada de los `function X()` declarados
// arriba y los atributos onclick="..." del index.html.
Object.assign(window, {
  // Navegación / UI
  navigate, toggleGuide, toggleG, toggleTool,
  closeModal, closeTemplateModal, openAutoModal, openTemplateModal,
  switchGTab, filterG,
  // Catálogo / solicitar
  submitForm, submitSolicitar, quickFill,
  // Autoservicio
  submitAutoservicioSimple, submitAutoservicioVM, submitAutoservicioNamespace,
  // Herramientas
  submitHerramientasJenkins, submitHerramientasBitbucket, submitHerramientasArgoCD,
  submitHerramientasKubernetes, submitHerramientasSonarQube, submitHerramientasGrafana,
  submitHerramientasHarbor, submitHerramientasVault,
  // Solicitudes
  submitSolicitudHerramienta, submitSolicitudContenedor,
  submitSolicitudInfraestructura, submitSolicitudAutomatizacion,
  // Despliegue
  submitDeploy, submitDespliegueKubernetes, submitDespliegueJenkins, submitDespliegueRollback,
  // Chat
  chatToggle, chatSend, chatSuggestion, chatAppend, chatEjecutarAccion, checkIAStatus,
  // Guía de campos
  activarGuiaCampos, clearGuide,
});

// ===============================================
// MARCA DE AGUA DE VERSIÓN
// - F:  frontend (inyectado por Vite en build time vía `define`).
// - B:  backend  (fetched desde GET /api/version en load).
// Formato: "F: #42 · 2026-11-10   B: #108 · 2026-11-10"
//   #N  = BITBUCKET_BUILD_NUMBER (consecutivo). 'local' fuera del CI.
// ===============================================
(function renderVersionWatermark() {
  // Globals inyectados por Vite (ver vite.config.js → define:).
  var frontBuild = (typeof __APP_BUILD__      !== 'undefined') ? __APP_BUILD__      : 'local';
  var frontDate  = (typeof __APP_BUILD_DATE__ !== 'undefined') ? __APP_BUILD_DATE__ : '';

  // Pinta "#42" cuando es numérico; "local" cuando es dev.
  function fmt(build, date) {
    var b = (/^\d+$/.test(String(build))) ? '#' + build : String(build);
    return b + (date ? ' · ' + date : '');
  }

  var el = document.createElement('div');
  el.className = 'version-watermark';
  el.textContent = 'F: ' + fmt(frontBuild, frontDate) + '   B: cargando...';
  document.body.appendChild(el);

  // Fetch versión backend (silencioso ante error).
  fetch(API_BASE + '/version')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(v) {
      var frontStr = 'F: ' + fmt(frontBuild, frontDate);
      if (!v) { el.textContent = frontStr + '   B: n/a'; return; }
      el.textContent = frontStr + '   B: ' + fmt(v.build, v.buildDate);
    })
    .catch(function() {
      el.textContent = 'F: ' + fmt(frontBuild, frontDate) + '   B: n/a';
    });
})();