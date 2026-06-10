apiVersion: apps/v1
kind: Deployment
metadata:
  name: $APP_NAME
  labels:
    app: $APP_NAME
    environment: $ENVIRONMENT
    version: $VERSION
spec:
  replicas: $REPLICAS
  selector:
    matchLabels:
      app: $APP_NAME
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  template:
    metadata:
      labels:
        app: $APP_NAME
        environment: $ENVIRONMENT
        version: $VERSION
    spec:
      containers:
      - name: $APP_NAME
        image: $IMAGE_REPO:$IMAGE_TAG
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: $APP_PORT
        envFrom:
        - configMapRef:
            name: $APP_NAME-config
        - secretRef:
            name: $APP_NAME-secret
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: $APP_PORT
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: $APP_PORT
          initialDelaySeconds: 5
          periodSeconds: 5