import { NextFunction, Request, Response } from 'express';
import {
  CreatePqrBackendUseCase,
  GetAllPqrsBackendUseCase,
  GetPqrByCodigoBackendUseCase,
  GetPqrByIdBackendUseCase,
  UpdatePqrCategoriaUseCase,
} from '../../application/usecases/pqrs/pqr.usecases.js';
import { ClassifyPqrUseCase } from '../../application/usecases/pqrs/classify-pqr.usecase.js';
import { AssignPqrResponsableBackendUseCase } from '../../application/usecases/pqrs/assign-responsable.usecase.js';
import { CustomError } from '../../domain/errors/custom.error.js';

export class PqrController {
  constructor(
    private readonly getAllUseCase: GetAllPqrsBackendUseCase,
    private readonly getByIdUseCase: GetPqrByIdBackendUseCase,
    private readonly getByCodigoUseCase: GetPqrByCodigoBackendUseCase,
    private readonly createUseCase: CreatePqrBackendUseCase,
    private readonly classifyUseCase?: ClassifyPqrUseCase,
    private readonly updateCategoriaUseCase?: UpdatePqrCategoriaUseCase,
    private readonly assignResponsableUseCase?: AssignPqrResponsableBackendUseCase
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

  classify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { texto, features } = req.body;
      if (!this.classifyUseCase) {
        throw CustomError.badRequest('Servicio de clasificación IA no disponible');
      }

      const result = await this.classifyUseCase.execute(texto, features);
      if (!result) {
        res.status(200).json({
          disponible: false,
          mensaje: 'El servicio de IA no se encuentra disponible temporalmente',
        });
        return;
      }

      res.json({
        disponible: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCategoria = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) throw CustomError.badRequest('ID de PQR inválido');

      if (!this.updateCategoriaUseCase) {
        throw CustomError.internal('Caso de uso para actualizar categoría no configurado');
      }

      const { idCategoria, categoria, estadoRevisionIa } = req.body;
      const idUsuario = req.user?.idUsuario ?? null;

      const updated = await this.updateCategoriaUseCase.execute({
        idPqr: id,
        idCategoria: Number(idCategoria),
        categoria: String(categoria).trim(),
        estadoRevisionIa,
        idUsuarioRevision: idUsuario,
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  assignResponsable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idPqr = Number(req.params.id);
      if (isNaN(idPqr) || idPqr <= 0) throw CustomError.badRequest('ID de PQR inválido');

      const { idResponsable } = req.body;
      const idResp = Number(idResponsable);
      if (isNaN(idResp) || idResp <= 0) {
        throw CustomError.badRequest('ID de responsable inválido o faltante');
      }

      if (!this.assignResponsableUseCase) {
        throw CustomError.internal('Caso de uso de asignación no configurado');
      }

      const updated = await this.assignResponsableUseCase.execute(idPqr, idResp);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  };
}
