import {
  appMiddlewares,
  authController,
  categoriasController,
  checkSlaAlertsUseCase,
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
      categoriasController,
    },
    appMiddlewares
  );

  const server = new Server({
    port: envs.PORT,
    routes,
  });

  server.start();

  const runSlaCheck = (): void => {
    checkSlaAlertsUseCase.execute().catch((err) => {
      console.error('[SLA Monitor] Error verificando alertas de vencimiento:', err);
    });
  };
  runSlaCheck();
  const intervalMs = envs.SLA_CHECK_INTERVAL_MINUTES * 60 * 1000;
  setInterval(runSlaCheck, intervalMs).unref();
}

main().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
