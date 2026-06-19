/**
 * DESPLIEGUE MANIFESTS BUILDER
 * Genera manifiestos YAML de Kubernetes listos para Bitbucket
 * Soporta: Deployment, Service, ConfigMap, Ingress, HPA
 */

/**
 * Construye Deployment YAML
 * @param {Object} config - { nombre, namespace, imagen, replicas, puerto, env, recursos, healthcheck }
 * @returns {string} YAML válido
 */
function construirDeployment(config) {
  const {
    nombre,
    namespace = 'default',
    imagen,
    replicas = 3,
    puerto = 8080,
    env = [],
    recursos = { cpu: '500m', memoria: '512Mi', cpuLimit: '1000m', memoriaLimit: '1Gi' },
    healthcheck = true
  } = config;

  const envYaml = env.map(e => `  - name: ${e.nombre}\n    value: "${e.valor}"`).join('\n');

  const livenessProbe = healthcheck ? `
    livenessProbe:
      httpGet:
        path: /health
        port: ${puerto}
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3` : '';

  const readinessProbe = healthcheck ? `
    readinessProbe:
      httpGet:
        path: /health
        port: ${puerto}
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 2` : '';

  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${nombre}
  namespace: ${namespace}
  labels:
    app: ${nombre}
    version: v1
    managed-by: devops-portal
spec:
  replicas: ${replicas}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ${nombre}
  template:
    metadata:
      labels:
        app: ${nombre}
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "${puerto}"
        prometheus.io/path: "/metrics"
    spec:
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
      containers:
      - name: ${nombre}
        image: ${imagen}
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: ${puerto}
          protocol: TCP
        env:
${envYaml}${envYaml ? '\n' : ''}
        resources:
          requests:
            cpu: ${recursos.cpu}
            memory: ${recursos.memoria}
          limits:
            cpu: ${recursos.cpuLimit}
            memory: ${recursos.memoriaLimit}${livenessProbe}${readinessProbe}
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: false
          capabilities:
            drop:
            - ALL
`;
}

/**
 * Construye Service YAML (ClusterIP)
 * @param {Object} config - { nombre, namespace, puerto, targetPort, tipo }
 * @returns {string} YAML válido
 */
function construirService(config) {
  const {
    nombre,
    namespace = 'default',
    puerto = 80,
    targetPort = 8080,
    tipo = 'ClusterIP'
  } = config;

  return `apiVersion: v1
kind: Service
metadata:
  name: ${nombre}
  namespace: ${namespace}
  labels:
    app: ${nombre}
spec:
  type: ${tipo}
  selector:
    app: ${nombre}
  ports:
  - name: http
    port: ${puerto}
    targetPort: ${targetPort}
    protocol: TCP
  sessionAffinity: None
`;
}

/**
 * Construye Ingress YAML (Nginx)
 * @param {Object} config - { nombre, namespace, host, puerto, serviceName, tlsSecret }
 * @returns {string} YAML válido
 */
function construirIngress(config) {
  const {
    nombre,
    namespace = 'default',
    host,
    puerto = 80,
    serviceName,
    tlsSecret = null
  } = config;

  const tlsYaml = tlsSecret ? `
  tls:
  - hosts:
    - ${host}
    secretName: ${tlsSecret}` : '';

  return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${nombre}
  namespace: ${namespace}
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
  - host: ${host}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${serviceName}
            port:
              number: ${puerto}${tlsYaml}
`;
}

/**
 * Construye ConfigMap YAML
 * @param {Object} config - { nombre, namespace, datos }
 * @returns {string} YAML válido
 */
function construirConfigMap(config) {
  const {
    nombre,
    namespace = 'default',
    datos = {}
  } = config;

  const datosYaml = Object.entries(datos)
    .map(([key, value]) => `  ${key}: |\n${value.split('\n').map(l => '    ' + l).join('\n')}`)
    .join('\n');

  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${nombre}
  namespace: ${namespace}
data:
${datosYaml}
`;
}

/**
 * Construye HPA (Horizontal Pod Autoscaler) YAML
 * @param {Object} config - { nombre, namespace, deployment, minReplicas, maxReplicas, cpuTarget }
 * @returns {string} YAML válido
 */
function construirHPA(config) {
  const {
    nombre,
    namespace = 'default',
    deployment,
    minReplicas = 2,
    maxReplicas = 10,
    cpuTarget = 70
  } = config;

  return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${nombre}
  namespace: ${namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${deployment}
  minReplicas: ${minReplicas}
  maxReplicas: ${maxReplicas}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ${cpuTarget}
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
`;
}

/**
 * Construye PVC (Persistent Volume Claim) YAML
 * @param {Object} config - { nombre, namespace, tamaño, storageClass, accessMode }
 * @returns {string} YAML válido
 */
function construirPVC(config) {
  const {
    nombre,
    namespace = 'default',
    tamaño = '10Gi',
    storageClass = 'standard',
    accessMode = 'ReadWriteOnce'
  } = config;

  return `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${nombre}
  namespace: ${namespace}
spec:
  accessModes:
  - ${accessMode}
  storageClassName: ${storageClass}
  resources:
    requests:
      storage: ${tamaño}
`;
}

/**
 * Construye RBAC ServiceAccount + Role + RoleBinding
 * @param {Object} config - { nombre, namespace, permissions }
 * @returns {string} YAML válido con SA, Role, RoleBinding
 */
function construirRBAC(config) {
  const {
    nombre,
    namespace = 'default',
    permissions = ['pods', 'services', 'configmaps']
  } = config;

  const verbs = ['get', 'list', 'watch'];
  const rulesYaml = permissions
    .map(resource => `
  - apiGroups:
    - ""
    resources:
    - ${resource}
    verbs:${verbs.map(v => `\n    - ${v}`).join('')}`)
    .join('');

  return `apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${nombre}
  namespace: ${namespace}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ${nombre}-role
  namespace: ${namespace}
rules:${rulesYaml}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ${nombre}-rolebinding
  namespace: ${namespace}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ${nombre}-role
subjects:
- kind: ServiceAccount
  name: ${nombre}
  namespace: ${namespace}
`;
}

/**
 * GENERADOR COMPLETO: Crea paquete de manifiestos
 * @param {Object} config - Configuración completa del despliegue
 * @returns {Object} { deployment.yaml, service.yaml, ingress.yaml, configmap.yaml, hpa.yaml }
 */
function generarManifiestos(config) {
  const {
    nombre,
    namespace = 'default',
    imagen,
    replicas = 3,
    puerto = 8080,
    host,
    env = [],
    config_data = {},
    recursos = {},
    incluirIngress = false,
    incluirHPA = false,
    incluirConfigMap = false,
    tlsSecret = null
  } = config;

  const manifiestos = {};

  // Deployment (siempre)
  manifiestos['deployment.yaml'] = construirDeployment({
    nombre,
    namespace,
    imagen,
    replicas,
    puerto,
    env,
    recursos: {
      cpu: recursos.cpu || '500m',
      memoria: recursos.memoria || '512Mi',
      cpuLimit: recursos.cpuLimit || '1000m',
      memoriaLimit: recursos.memoriaLimit || '1Gi'
    }
  });

  // Service (siempre)
  manifiestos['service.yaml'] = construirService({
    nombre,
    namespace,
    puerto: puerto,
    targetPort: puerto,
    tipo: 'ClusterIP'
  });

  // Ingress (opcional)
  if (incluirIngress && host) {
    manifiestos['ingress.yaml'] = construirIngress({
      nombre,
      namespace,
      host,
      puerto,
      serviceName: nombre,
      tlsSecret
    });
  }

  // ConfigMap (opcional)
  if (incluirConfigMap && Object.keys(config_data).length > 0) {
    manifiestos['configmap.yaml'] = construirConfigMap({
      nombre: `${nombre}-config`,
      namespace,
      datos: config_data
    });
  }

  // HPA (opcional)
  if (incluirHPA) {
    manifiestos['hpa.yaml'] = construirHPA({
      nombre: `${nombre}-hpa`,
      namespace,
      deployment: nombre,
      minReplicas: 2,
      maxReplicas: 10
    });
  }

  return manifiestos;
}

module.exports = {
  construirDeployment,
  construirService,
  construirIngress,
  construirConfigMap,
  construirHPA,
  construirPVC,
  construirRBAC,
  generarManifiestos
};
