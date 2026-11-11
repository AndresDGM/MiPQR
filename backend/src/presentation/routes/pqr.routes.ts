import { RequestHandler, Router } from 'express';
import { PqrController } from '../controllers/pqr.controller.js';
import { DocumentosController } from '../controllers/documentos.controller.js';
import { DocumentosRoutes } from './documentos.routes.js';

export interface PqrRoutesMiddlewares {
  authenticate: RequestHandler;
  optionalAuthenticate: RequestHandler;
  upload: RequestHandler;
}

export class PqrRoutes {
  static routes(
    controller: PqrController,
    documentosController: DocumentosController,
    middlewares: PqrRoutesMiddlewares
  ): Router {
    const router = Router();
    const { optionalAuthenticate } = middlewares;

    router.get('/', optionalAuthenticate, controller.getAll);
    router.get('/codigo/:codigo', optionalAuthenticate, controller.getByCodigo);
    router.get('/:id', optionalAuthenticate, controller.getById);
    router.post('/', optionalAuthenticate, controller.create);

    // Rutas de adjuntos anidadas: /api/pqrs/:id/attachments y /api/pqrs/:id/adjuntos
    const nested = DocumentosRoutes.pqrNestedRoutes(documentosController, middlewares);
    router.use('/:id/attachments', nested);
    router.use('/:id/adjuntos', nested);

    return router;
  }
}
