import 'dotenv/config';

export interface Env {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  jwtSecret: string;
  setupToken: string;
  /** Zona con la que se cuentan las fechas de los reportes. */
  zonaHoraria: string;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
}

function requireVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export const env: Env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  jwtSecret: requireVar('JWT_SECRET'),
  setupToken: requireVar('SETUP_TOKEN'),
  zonaHoraria: process.env.ZONA_HORARIA ?? 'America/Lima',
  db: {
    host: requireVar('DB_HOST'),
    port: Number(requireVar('DB_PORT')),
    name: requireVar('DB_NAME'),
    user: requireVar('DB_USER'),
    password: requireVar('DB_PASSWORD'),
  },
};
