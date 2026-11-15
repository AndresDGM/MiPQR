import { NextFunction, Request, Response } from 'express';
import { CreateUsuarioDto } from '../../domain/dtos/create-usuario.dto.js';
import { SetActivoDto } from '../../domain/dtos/set-activo.dto.js';
import { UpdateUsuarioDto } from '../../domain/dtos/update-usuario.dto.js';
import { CreateUsuarioUseCase } from '../../application/usecases/usuarios/create-usuario.usecase.js';
import { GetAllUsuariosUseCase } from '../../application/usecases/usuarios/get-all-usuarios.usecase.js';
import { GetUsuarioByIdUseCase } from '../../application/usecases/usuarios/get-usuario-by-id.usecase.js';
import { GetUsuariosByRolUseCase } from '../../application/usecases/usuarios/get-usuarios-by-rol.usecase.js';
import { SetUsuarioActivoUseCase } from '../../application/usecases/usuarios/set-usuario-activo.usecase.js';
import { UpdateUsuarioUseCase } from '../../application/usecases/usuarios/update-usuario.usecase.js';

export class UsuariosController {
  constructor(
    private readonly getAllUsuariosUseCase: GetAllUsuariosUseCase,
    private readonly getUsuarioByIdUseCase: GetUsuarioByIdUseCase,
    private readonly getUsuariosByRolUseCase: GetUsuariosByRolUseCase,
    private readonly createUsuarioUseCase: CreateUsuarioUseCase,
    private readonly updateUsuarioUseCase: UpdateUsuarioUseCase,
    private readonly setUsuarioActivoUseCase: SetUsuarioActivoUseCase
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let count: number | undefined;
      if (req.query.count !== undefined) {
        count = Number(req.query.count);
        if (isNaN(count) || !Number.isInteger(count) || count <= 0) {
          res.status(400).json({ error: 'El parametro count debe ser un numero entero positivo' });
          return;
        }
      }

      const usuarios = await this.getAllUsuariosUseCase.execute(count);
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'El id de usuario debe ser un numero entero positivo' });
        return;
      }

      const usuario = await this.getUsuarioByIdUseCase.execute(id, req.user!);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  };

  getByRol = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rol } = req.params;
      const rolStr = Array.isArray(rol) ? rol[0] : rol;
      if (!rolStr) {
        res.status(400).json({ error: 'El nombre de rol es requerido' });
        return;
      }

      const usuarios = await this.getUsuariosByRolUseCase.execute(rolStr);
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [error, dto] = CreateUsuarioDto.create(req.body);
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const usuario = await this.createUsuarioUseCase.execute(dto!);
      res.status(201).json(usuario);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'El id de usuario debe ser un numero entero positivo' });
        return;
      }

      const [error, dto] = UpdateUsuarioDto.create(req.body);
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const usuario = await this.updateUsuarioUseCase.execute(id, dto!, req.user!);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  };

  setActivo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'El id de usuario debe ser un numero entero positivo' });
        return;
      }

      const [error, dto] = SetActivoDto.create(req.body);
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const usuario = await this.setUsuarioActivoUseCase.execute(id, dto!, req.user!);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  };
}
