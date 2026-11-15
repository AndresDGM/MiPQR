import { RolNombre } from '../entities/rol.entity.js';

export interface TokenPayload {
  /** Identificador del usuario (idUsuario como texto) */
  sub: string;
  idRol: number;
  rol: RolNombre;
}

export abstract class TokenService {
  abstract sign(payload: TokenPayload): string;

  /** Lanza CustomError.unauthorized('Token invalido' | 'Token expirado') */
  abstract verify(token: string): TokenPayload;
}
