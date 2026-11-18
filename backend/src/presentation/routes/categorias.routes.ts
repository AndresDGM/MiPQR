import { Router } from 'express';
import { CategoriasController } from '../controllers/categorias.controller.js';

export class CategoriasRoutes {
  static routes(controller: CategoriasController): Router {
    const router = Router();

    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);

    return router;
  }
}
