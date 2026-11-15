import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AppMiddlewares } from './index.js';

export class AuthRoutes {
  static routes(controller: AuthController, middlewares: AppMiddlewares): Router {
    const router = Router();

    const { decryptFields } = middlewares;

    router.post('/login', decryptFields('correo', 'password'), controller.login);
    router.post('/register', decryptFields('correo', 'password'), controller.register);
    router.get('/me', middlewares.authenticate, controller.me);

    return router;
  }
}
