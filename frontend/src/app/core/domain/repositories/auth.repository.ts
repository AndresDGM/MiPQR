import { Observable } from 'rxjs';
import { AuthSession, RegisterPayload } from '../models/auth-session.model';

/**
 * Contrato de autenticación de usuarios.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class AuthRepository {
  /** Autentica con correo y contraseña. */
  abstract login(correo: string, password: string): Observable<AuthSession>;

  /** Registra una cuenta de solicitante y devuelve su sesión. */
  abstract register(payload: RegisterPayload): Observable<AuthSession>;
}
