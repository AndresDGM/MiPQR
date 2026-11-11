import { RequestHandler, Router } from 'express';
import { DocumentosController } from '../controllers/documentos.controller.js';

export interface DocumentosRoutesMiddlewares {
  authenticate: RequestHandler;
  optionalAuthenticate: RequestHandler;
  upload: RequestHandler;
}

/**
 * Definición de rutas HTTP para la gestión de documentos adjuntos.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
export class DocumentosRoutes {
  static routes(
    controller: DocumentosController,
    middlewares: DocumentosRoutesMiddlewares
  ): Router {
    const router = Router();
    const { authenticate, optionalAuthenticate, upload } = middlewares;

    // Rutas directas sobre adjuntos
    router.get('/:id', optionalAuthenticate, controller.getById);
    router.delete('/:id', authenticate, controller.delete);

    return router;
  }

  /**
   * Rutas anidadas bajo el recurso de PQR: /api/pqrs/:id/attachments
   */
  static pqrNestedRoutes(
    controller: DocumentosController,
    middlewares: DocumentosRoutesMiddlewares
  ): Router {
    const router = Router({ mergeParams: true });
    const { optionalAuthenticate, upload } = middlewares;

    router.post('/', optionalAuthenticate, upload, controller.upload);
    router.get('/', optionalAuthenticate, controller.getByPqr);

    return router;
  }
}
