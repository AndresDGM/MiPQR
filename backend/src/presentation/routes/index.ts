import { RequestHandler, Router } from 'express';
import { RolNombre } from '../../domain/entities/rol.entity.js';
import { AuthController } from '../controllers/auth.controller.js';
import { RolesController } from '../controllers/roles.controller.js';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { DocumentosController } from '../controllers/documentos.controller.js';
import { PqrController } from '../controllers/pqr.controller.js';
import { AuthRoutes } from './auth.routes.js';
import { RolesRoutes } from './roles.routes.js';
import { UsuariosRoutes } from './usuarios.routes.js';
import { DocumentosRoutes } from './documentos.routes.js';
import { PqrRoutes } from './pqr.routes.js';

export interface AppControllers {
  usuariosController: UsuariosController;
  rolesController: RolesController;
  authController: AuthController;
  documentosController: DocumentosController;
  pqrController: PqrController;
}

export interface AppMiddlewares {
  authenticate: RequestHandler;
  optionalAuthenticate: RequestHandler;
  authorize: (...rolesPermitidos: RolNombre[]) => RequestHandler;
  /** Descifra los campos indicados del body de la peticion */
  decryptFields: (...campos: string[]) => RequestHandler;
  upload: RequestHandler;
}

export class AppRoutes {
  static routes(controllers: AppControllers, middlewares: AppMiddlewares): Router {
    const router = Router();
    const { authenticate, optionalAuthenticate, upload } = middlewares;

    router.get('/health', (_req, res) => {
      res.json({ status: 'ok', message: 'Servidor iniciado correctamente' });
    });

    router.use('/users', UsuariosRoutes.routes(controllers.usuariosController, middlewares));
    router.use('/roles', RolesRoutes.routes(controllers.rolesController, middlewares));
    router.use('/auth', AuthRoutes.routes(controllers.authController, middlewares));

    // Módulos de PQR y Documentos de soporte
    const pqrRouter = PqrRoutes.routes(
      controllers.pqrController,
      controllers.documentosController,
      { authenticate, optionalAuthenticate, upload }
    );
    router.use('/pqrs', pqrRouter);
    router.use('/pqr', pqrRouter);

    const docRouter = DocumentosRoutes.routes(controllers.documentosController, {
      authenticate,
      optionalAuthenticate,
      upload,
    });
    router.use('/attachments', docRouter);
    router.use('/adjuntos', docRouter);

    return router;
  }
}
