import { RequestHandler, Router } from 'express';
import { RolNombre } from '../../domain/entities/rol.entity.js';
import { PqrController } from '../controllers/pqr.controller.js';
import { DocumentosController } from '../controllers/documentos.controller.js';
import { DocumentosRoutes } from './documentos.routes.js';

export interface PqrRoutesMiddlewares {
  authenticate: RequestHandler;
  optionalAuthenticate: RequestHandler;
  authorize: (...rolesPermitidos: RolNombre[]) => RequestHandler;
  upload: RequestHandler;
}

export class PqrRoutes {
  static routes(
    controller: PqrController,
    documentosController: DocumentosController,
    middlewares: PqrRoutesMiddlewares
  ): Router {
    const router = Router();
    const { authenticate, optionalAuthenticate, authorize } = middlewares;
    const gestionPqr = authorize('Analista SIAU', 'Responsable', 'Directivo');

    router.get('/', optionalAuthenticate, controller.getAll);
    router.get('/codigo/:codigo', optionalAuthenticate, controller.getByCodigo);
    router.get('/:id', optionalAuthenticate, controller.getById);
    router.get('/:id/historial', optionalAuthenticate, controller.getHistorial);
    router.post('/', optionalAuthenticate, controller.create);
    router.post('/classify', optionalAuthenticate, controller.classify);
    router.patch('/:id/categoria', optionalAuthenticate, controller.updateCategoria);
    router.patch('/:id/responsable', authenticate, controller.assignResponsable);
    router.patch('/:id/estado', authenticate, gestionPqr, controller.updateEstado);
    router.post('/:id/respuestas', authenticate, gestionPqr, controller.responder);

    // Rutas de adjuntos anidadas: /api/pqrs/:id/attachments y /api/pqrs/:id/adjuntos
    const nested = DocumentosRoutes.pqrNestedRoutes(documentosController, middlewares);
    router.use('/:id/attachments', nested);
    router.use('/:id/adjuntos', nested);

    return router;
  }
}
