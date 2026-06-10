apiVersion: v1
kind: Secret
metadata:
  name: $APP_NAME-secret
type: Opaque
data:
  # Estos valores deben ser codificados en base64
  # echo -n "valor" | base64
  DB_PASSWORD: $DB_PASSWORD_B64
  REDIS_PASSWORD: $REDIS_PASSWORD_B64
  API_KEY: $API_KEY_B64
  JWT_SECRET: $JWT_SECRET_B64