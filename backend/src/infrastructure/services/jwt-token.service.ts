import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { envs } from '../../config/envs.js';
import { RolNombre } from '../../domain/entities/rol.entity.js';
import { CustomError } from '../../domain/errors/custom.error.js';
import { TokenPayload, TokenService } from '../../domain/services/token.service.js';

const ALGORITHM = 'HS256';
const ROLES_VALIDOS: RolNombre[] = ['Solicitante', 'Analista SIAU', 'Responsable', 'Directivo'];

export class JwtTokenService extends TokenService {
  sign(payload: TokenPayload): string {
    const options: SignOptions = {
      algorithm: ALGORITHM,
      expiresIn: envs.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, envs.JWT_SECRET, options);
  }

  verify(token: string): TokenPayload {
    let decoded: string | JwtPayload;
    try {
      // Fijar el algoritmo impide aceptar tokens con alg "none" u otro distinto
      decoded = jwt.verify(token, envs.JWT_SECRET, { algorithms: [ALGORITHM] });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw CustomError.unauthorized('Token expirado');
      }
      throw CustomError.unauthorized('Token invalido');
    }

    return this.toPayload(decoded);
  }

  /** Valida la forma del payload decodificado; cualquier desvio es un token invalido */
  private toPayload(decoded: string | JwtPayload): TokenPayload {
    if (typeof decoded === 'string') {
      throw CustomError.unauthorized('Token invalido');
    }

    const { sub, idRol, rol } = decoded;
    const subValido = typeof sub === 'string' && /^\d+$/.test(sub);
    const idRolValido = typeof idRol === 'number' && Number.isInteger(idRol);
    const rolValido = typeof rol === 'string' && ROLES_VALIDOS.includes(rol as RolNombre);

    if (!subValido || !idRolValido || !rolValido) {
      throw CustomError.unauthorized('Token invalido');
    }

    return { sub: sub as string, idRol: idRol as number, rol: rol as RolNombre };
  }
}
