import { UsuarioPublico } from './usuario-publico.type.js';

/** Respuesta de login y registro: token de acceso y datos publicos del usuario */
export interface AuthSession {
  token: string;
  usuario: UsuarioPublico;
}
