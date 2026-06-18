module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  CORREO_DESTINO: process.env.CORREO_DESTINO || 'pruebasportal+digital@bancobase.com',
  
  // SMTP Config para el envío de correos corporativos
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.i.gslb',
  SMTP_PORT: process.env.SMTP_PORT || 25,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  // Integración Jira
  JIRA_DOMAIN: process.env.JIRA_DOMAIN || 'https://bancobase.atlassian.net',
  JIRA_PROJECT_KEY: process.env.JIRA_PROJECT_KEY || 'BSJ',
  JIRA_USER_EMAIL: process.env.JIRA_USER_EMAIL || 'digital@bancobase.com',
  JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
  JIRA_TYPE_SOLICITUD: process.env.JIRA_TYPE_SOLICITUD || '10428',
};
