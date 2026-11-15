import { RolNombre } from '../../domain/entities/rol.entity.js';

/** Usuario autenticado que ejecuta una operacion; lo llena la capa de presentacion */
export interface Actor {
  idUsuario: number;
  rol: RolNombre;
}
