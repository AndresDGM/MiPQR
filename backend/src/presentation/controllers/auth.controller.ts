import { NextFunction, Request, Response } from 'express';
import { LoginDto } from '../../domain/dtos/login.dto.js';
import { RegisterDto } from '../../domain/dtos/register.dto.js';
import { LoginUseCase } from '../../application/usecases/auth/login.usecase.js';
import { RegisterUseCase } from '../../application/usecases/auth/register.usecase.js';
import { GetUsuarioByIdUseCase } from '../../application/usecases/usuarios/get-usuario-by-id.usecase.js';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly getUsuarioByIdUseCase: GetUsuarioByIdUseCase
  ) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [error, dto] = LoginDto.create(req.body);
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const session = await this.loginUseCase.execute(dto!);
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [error, dto] = RegisterDto.create(req.body);
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const session = await this.registerUseCase.execute(dto!);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const usuario = await this.getUsuarioByIdUseCase.execute(req.user!.idUsuario, req.user!);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  };
}
