import { NextFunction, Request, RequestHandler, Response } from 'express';
import { RolNombre } from '../../domain/entities/rol.entity.js';
import { CustomError } from '../../domain/errors/custom.error.js';

/** Permite el paso solo a los roles indicados. Debe ir despues de authenticate. */
export function authorize(...rolesPermitidos: RolNombre[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(CustomError.unauthorized('Token no proporcionado'));
      return;
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      next(CustomError.forbidden('No tiene permisos para realizar esta accion'));
      return;
    }

    next();
  };
}
