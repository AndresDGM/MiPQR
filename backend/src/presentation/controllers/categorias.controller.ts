import { NextFunction, Request, Response } from 'express';
import { GetAllCategoriasUseCase } from '../../application/usecases/categorias/get-all-categorias.usecase.js';
import { GetCategoriaByIdUseCase } from '../../application/usecases/categorias/get-categoria-by-id.usecase.js';

export class CategoriasController {
  constructor(
    private readonly getAllCategoriasUseCase: GetAllCategoriasUseCase,
    private readonly getCategoriaByIdUseCase: GetCategoriaByIdUseCase
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categorias = await this.getAllCategoriasUseCase.execute();
      res.json(categorias);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const categoria = await this.getCategoriaByIdUseCase.execute(id);
      res.json(categoria);
    } catch (error) {
      next(error);
    }
  };
}
