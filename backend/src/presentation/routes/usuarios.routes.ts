import { Router } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { AppMiddlewares } from './index.js';

export class UsuariosRoutes {
  static routes(controller: UsuariosController, middlewares: AppMiddlewares): Router {
    const router = Router();
    const { authenticate, authorize, decryptFields } = middlewares;

    router.get('/', authenticate, authorize('Analista SIAU', 'Responsable', 'Directivo'), controller.getAll);
    router.get('/rol/:rol', authenticate, authorize('Analista SIAU', 'Directivo'), controller.getByRol);
    // Self o personal de consulta: la regla se valida en el caso de uso
    router.get('/:id', authenticate, controller.getById);
    router.post('/', authenticate, authorize('Directivo'), decryptFields('correo', 'password'), controller.create);
    // Directivo o Self: la regla se valida en el caso de uso
    router.put('/:id', authenticate, decryptFields('correo'), controller.update);
    router.patch('/:id/activo', authenticate, authorize('Directivo'), controller.setActivo);

    return router;
  }
}
