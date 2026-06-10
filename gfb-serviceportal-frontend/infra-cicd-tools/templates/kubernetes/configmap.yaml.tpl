apiVersion: v1
kind: ConfigMap
metadata:
  name: $APP_NAME-config
data:
  APP_NAME: "$APP_NAME"
  ENVIRONMENT: "$ENVIRONMENT"
  APP_PORT: "$APP_PORT"
  LOG_LEVEL: "info"
  DATABASE_URL: "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME"
  REDIS_URL: "redis://$REDIS_HOST:6379"
  CACHE_TTL: "3600"