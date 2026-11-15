import { NextFunction, Request, Response } from 'express';
import { AttachDocumentosUseCase } from '../../application/usecases/adjuntos/attach-documentos.usecase.js';
import { DeleteDocumentoUseCase } from '../../application/usecases/adjuntos/delete-documento.usecase.js';
import { GetDocumentoByIdUseCase } from '../../application/usecases/adjuntos/get-documento-by-id.usecase.js';
import { GetDocumentosByPqrUseCase } from '../../application/usecases/adjuntos/get-documentos-by-pqr.usecase.js';
import { CustomError } from '../../domain/errors/custom.error.js';

/**
 * Controlador REST para la gestión de documentos adjuntos y soportes.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
export class DocumentosController {
  constructor(
    private readonly attachDocumentosUseCase: AttachDocumentosUseCase,
    private readonly getDocumentosByPqrUseCase: GetDocumentosByPqrUseCase,
    private readonly getDocumentoByIdUseCase: GetDocumentoByIdUseCase,
    private readonly deleteDocumentoUseCase: DeleteDocumentoUseCase
  ) {}

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idPqr = Number(req.params.id);
      if (isNaN(idPqr) || !Number.isInteger(idPqr) || idPqr <= 0) {
        throw CustomError.badRequest('El identificador de PQR debe ser un entero positivo');
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw CustomError.badRequest('Debe proporcionar al menos un archivo en el campo "files"');
      }

      const fileInputs = files.map((f) => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        buffer: f.buffer,
      }));

      const adjuntos = await this.attachDocumentosUseCase.execute(idPqr, fileInputs, req.user);
      res.status(201).json(adjuntos);
    } catch (error) {
      next(error);
    }
  };

  getByPqr = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idPqr = Number(req.params.id);
      if (isNaN(idPqr) || !Number.isInteger(idPqr) || idPqr <= 0) {
        throw CustomError.badRequest('El identificador de PQR debe ser un entero positivo');
      }

      const codigo = (req.query.codigo as string | undefined)?.trim();
      const adjuntos = await this.getDocumentosByPqrUseCase.execute(idPqr, req.user, codigo);
      res.json(adjuntos);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idAdjunto = Number(req.params.id);
      if (isNaN(idAdjunto) || !Number.isInteger(idAdjunto) || idAdjunto <= 0) {
        throw CustomError.badRequest('El identificador de documento debe ser un entero positivo');
      }

      const codigo = (req.query.codigo as string | undefined)?.trim();
      const isInline = req.query.inline === 'true' || req.query.inline === '1';

      const { adjunto, absolutePath } = await this.getDocumentoByIdUseCase.execute(
        idAdjunto,
        req.user,
        codigo
      );

      // Cabeceras seguras
      res.setHeader('Content-Type', adjunto.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Nombre codificado según RFC 5987 para caracteres especiales o acentos
      const encodedFilename = encodeURIComponent(adjunto.nombreOriginal).replace(/['()]/g, escape);
      const disposition = isInline ? 'inline' : 'attachment';

      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${adjunto.nombreOriginal.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`
      );

      res.sendFile(absolutePath);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idAdjunto = Number(req.params.id);
      if (isNaN(idAdjunto) || !Number.isInteger(idAdjunto) || idAdjunto <= 0) {
        throw CustomError.badRequest('El identificador de documento debe ser un entero positivo');
      }

      if (!req.user) {
        throw CustomError.unauthorized('Debe estar autenticado para eliminar un adjunto');
      }

      const deleted = await this.deleteDocumentoUseCase.execute(idAdjunto, req.user);
      res.json({ success: deleted, message: 'Documento adjunto eliminado correctamente' });
    } catch (error) {
      next(error);
    }
  };
}
