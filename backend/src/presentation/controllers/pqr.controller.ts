import { NextFunction, Request, Response } from 'express';
import {
  CreatePqrBackendUseCase,
  GetAllPqrsBackendUseCase,
  GetPqrByCodigoBackendUseCase,
  GetPqrByIdBackendUseCase,
} from '../../application/usecases/pqrs/pqr.usecases.js';
import { CustomError } from '../../domain/errors/custom.error.js';

export class PqrController {
  constructor(
    private readonly getAllUseCase: GetAllPqrsBackendUseCase,
    private readonly getByIdUseCase: GetPqrByIdBackendUseCase,
    private readonly getByCodigoUseCase: GetPqrByCodigoBackendUseCase,
    private readonly createUseCase: CreatePqrBackendUseCase
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const pqrs = await this.getAllUseCase.execute(limit);
      res.json(pqrs);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) throw CustomError.badRequest('ID de PQR inválido');
      const pqr = await this.getByIdUseCase.execute(id);
      res.json(pqr);
    } catch (error) {
      next(error);
    }
  };

  getByCodigo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { codigo } = req.params;
      const codStr = Array.isArray(codigo) ? codigo[0] : codigo;
      if (!codStr) throw CustomError.badRequest('Código de seguimiento requerido');
      const pqr = await this.getByCodigoUseCase.execute(codStr);
      res.json(pqr);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        tipoPqr,
        idCategoria,
        asunto,
        descripcion,
        nombreSolicitante,
        correoSolicitante,
        identificacionSolicitante,
      } = req.body;

      if (!tipoPqr || !asunto || !descripcion || !nombreSolicitante || !correoSolicitante) {
        throw CustomError.badRequest('Faltan campos obligatorios para radicar la PQR');
      }

      const pqr = await this.createUseCase.execute({
        tipoPqr,
        idCategoria: Number(idCategoria) || 1,
        asunto: String(asunto).trim(),
        descripcion: String(descripcion).trim(),
        nombreSolicitante: String(nombreSolicitante).trim(),
        correoSolicitante: String(correoSolicitante).trim().toLowerCase(),
        identificacionSolicitante: String(identificacionSolicitante || '').trim(),
        idSolicitante: req.user?.idUsuario ?? null,
      });

      res.status(201).json(pqr);
    } catch (error) {
      next(error);
    }
  };
}
