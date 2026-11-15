import { RolNombre } from '../../domain/entities/rol.entity.js';
import { Usuario } from '../../domain/entities/usuario.entity.js';

export interface UsuarioPublico {
  idUsuario: number;
  idRol: number;
  rol: RolNombre;
  nombre: string;
  correo: string;
  identificacion: string;
  activo: boolean;
}

export function toUsuarioPublico(usuario: Usuario, rolNombre: RolNombre): UsuarioPublico {
  return {
    idUsuario: usuario.idUsuario,
    idRol: usuario.idRol,
    rol: rolNombre,
    nombre: usuario.nombre,
    correo: usuario.correo,
    identificacion: usuario.identificacion,
    activo: usuario.activo,
  };
}
