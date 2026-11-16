import 'dotenv/config';
import env from 'env-var';

export const envs = {
  PORT: env.get('PORT').default('3000').asPortNumber(),
  DB_HOST: env.get('DB_HOST').default('localhost').asString(),
  DB_PORT: env.get('DB_PORT').default('5432').asPortNumber(),
  DB_USER: env.get('DB_USER').default('postgres').asString(),
  DB_PASSWORD: env.get('DB_PASSWORD').default('postgres').asString(),
  DB_NAME: env.get('DB_NAME').default('mipqr').asString(),
  // Secreto obligatorio para firmar los JWT; no tiene valor por defecto
  JWT_SECRET: env.get('JWT_SECRET').required().asString(),
  // Clave DES compartida con el cliente: exactamente 8 caracteres
  DES_KEY: env.get('DES_KEY').required().asString(),
  // Claves RSA en hexadecimal (se generan con `npm run rsa:generate`)
  RSA_N: env.get('RSA_N').required().asString(),
  RSA_E: env.get('RSA_E').default('10001').asString(),
  RSA_D: env.get('RSA_D').required().asString(),
  JWT_EXPIRES_IN: env.get('JWT_EXPIRES_IN').default('8h').asString(),
  // Almacenamiento de archivos adjuntos (fuera de rutas publicas)
  STORAGE_PATH: env.get('STORAGE_PATH').default('./uploads/adjuntos').asString(),
  MAX_FILE_SIZE_MB: env.get('MAX_FILE_SIZE_MB').default('10').asIntPositive(),
  MAX_FILES_PER_REQUEST: env.get('MAX_FILES_PER_REQUEST').default('5').asIntPositive(),
  MAX_TOTAL_SIZE_MB: env.get('MAX_TOTAL_SIZE_MB').default('25').asIntPositive(),
  // Configuracion del servicio de correo electronico (SMTP)
  SMTP_HOST: env.get('SMTP_HOST').asString(),
  SMTP_PORT: env.get('SMTP_PORT').default('587').asPortNumber(),
  SMTP_USER: env.get('SMTP_USER').asString(),
  SMTP_PASS: env.get('SMTP_PASS').asString(),
  SMTP_FROM: env.get('SMTP_FROM').default('MiPQR Clinica Dolormed <notificaciones@mipqr.com>').asString(),
  SMTP_SECURE: env.get('SMTP_SECURE').default('false').asBool(),
  APP_URL: env.get('APP_URL').default('http://localhost:4200').asString(),
};
