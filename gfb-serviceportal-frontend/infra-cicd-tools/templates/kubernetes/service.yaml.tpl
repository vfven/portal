apiVersion: v1
kind: Service
metadata:
  name: $APP_NAME-service
  labels:
    app: $APP_NAME
    environment: $ENVIRONMENT
spec:
  selector:
    app: $APP_NAME
  ports:
  - name: http
    port: 80
    targetPort: $APP_PORT
    protocol: TCP
  type: ClusterIP