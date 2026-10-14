import { env } from './config/env';
import { ejecutarMigraciones } from './database/migrator';
import { Server } from './app';

async function iniciar(): Promise<void> {
  await ejecutarMigraciones();

  const server = new Server();
  server.app.listen(env.port, '0.0.0.0', () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

iniciar().catch((error: unknown) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
