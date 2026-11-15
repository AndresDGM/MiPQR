import { NextFunction, Request, RequestHandler, Response } from 'express';
import multer, { MulterError } from 'multer';
import { CustomError } from '../../domain/errors/custom.error.js';

/**
 * Middleware para procesar peticiones multipart/form-data.
 *
 * @description
 * Configura almacenamiento en memoria con límites estrictos de tamaño y archivos
 * para permitir la inspección profunda de firmas mágicas antes de la escritura en disco.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
export function createUploadMiddleware(maxFileSizeBytes: number, maxFiles: number): RequestHandler {
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSizeBytes,
      files: maxFiles,
    },
  }).array('files', maxFiles);

  return (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (err: unknown) => {
      if (!err) {
        return next();
      }

      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxMb = (maxFileSizeBytes / (1024 * 1024)).toFixed(1);
          return next(
            CustomError.badRequest(
              `Uno de los archivos excede el tamaño máximo permitido de ${maxMb} MB`
            )
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            CustomError.badRequest(
              `Se ha superado la cantidad máxima permitida de ${maxFiles} archivos por solicitud`
            )
          );
        }
        return next(CustomError.badRequest(`Error al procesar la carga: ${err.message}`));
      }

      return next(err);
    });
  };
}
