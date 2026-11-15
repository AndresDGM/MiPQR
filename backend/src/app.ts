import {
  appMiddlewares,
  authController,
  documentosController,
  passwordCipher,
  pqrController,
  rolesController,
  usuariosController,
} from './config/dependencies.js';
import { envs } from './config/envs.js';
import { initDatabase } from './infrastructure/database/postgres.js';
import { AppRoutes } from './presentation/routes/index.js';
import { Server } from './presentation/server.js';

async function main(): Promise<void> {
  await initDatabase(passwordCipher);

  const routes = AppRoutes.routes(
    {
      authController,
      rolesController,
      usuariosController,
      documentosController,
      pqrController,
    },
    appMiddlewares
  );

  const server = new Server({
    port: envs.PORT,
    routes,
  });

  server.start();
}

main().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
