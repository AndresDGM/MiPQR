import { RolNombre } from '../../domain/entities/rol.entity.js';

/** Usuario autenticado que adjunta el middleware authenticate */
export interface RequestUser {
  idUsuario: number;
  idRol: number;
  rol: RolNombre;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export {};
