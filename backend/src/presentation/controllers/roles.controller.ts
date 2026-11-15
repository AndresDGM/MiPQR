import { NextFunction, Request, Response } from 'express';
import { GetAllRolesUseCase } from '../../application/usecases/roles/get-all-roles.usecase.js';
import { GetRolByIdUseCase } from '../../application/usecases/roles/get-rol-by-id.usecase.js';

export class RolesController {
  constructor(
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly getRolByIdUseCase: GetRolByIdUseCase
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await this.getAllRolesUseCase.execute();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'El id de rol debe ser un numero entero positivo' });
        return;
      }

      const rol = await this.getRolByIdUseCase.execute(id);
      res.json(rol);
    } catch (error) {
      next(error);
    }
  };
}
