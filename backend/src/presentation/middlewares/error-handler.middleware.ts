import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../../domain/errors/custom.error.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Errores de parseo de express.json() (cuerpo con JSON mal formado)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON valido' });
    return;
  }

  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Ruta no encontrada' });
}
