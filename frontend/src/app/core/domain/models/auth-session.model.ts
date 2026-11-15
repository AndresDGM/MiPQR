import { User } from './user.model';

/**
 * Sesión resultante de autenticar o registrar a un usuario.
 */
export interface AuthSession {
  /** Token de acceso que se envía en el header Authorization */
  token: string;

  /** Usuario autenticado */
  usuario: User;
}

/**
 * Datos necesarios para el registro público de un solicitante.
 */
export interface RegisterPayload {
  nombre: string;
  correo: string;
  identificacion: string;
  password: string;
}
