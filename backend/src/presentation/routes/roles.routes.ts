import { Router } from 'express';
import { RolesController } from '../controllers/roles.controller.js';
import { AppMiddlewares } from './index.js';

export class RolesRoutes {
  static routes(controller: RolesController, middlewares: AppMiddlewares): Router {
    const router = Router();
    const { authenticate, authorize } = middlewares;
    const consulta = authorize('Analista SIAU', 'Responsable', 'Directivo');

    router.get('/', authenticate, consulta, controller.getAll);
    router.get('/:id', authenticate, consulta, controller.getById);

    return router;
  }
}
