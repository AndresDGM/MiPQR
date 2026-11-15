import { NextFunction, Request, RequestHandler, Response } from 'express';
import { CustomError } from '../../domain/errors/custom.error.js';
import { CipherService } from '../../domain/services/cipher.service.js';

/**
 * Descifra los campos indicados del body antes de que lleguen al controlador.
 *
 * El cifrado es obligatorio: un valor en texto plano o manipulado no se puede
 * descifrar y se rechaza con 400. Los campos ausentes se omiten para que la
 * validacion del DTO informe que faltan.
 */
export function decryptBody(cipherService: CipherService, ...campos: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      next();
      return;
    }

    try {
      for (const campo of campos) {
        if (body[campo] === undefined) continue;

        if (typeof body[campo] !== 'string') {
          throw CustomError.badRequest(`El campo "${campo}" debe enviarse cifrado`);
        }

        try {
          body[campo] = cipherService.decrypt(body[campo]);
        } catch {
          throw CustomError.badRequest(`El campo "${campo}" no esta cifrado correctamente`);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
