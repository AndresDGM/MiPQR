import { Usuario } from '../entities/usuario.entity.js';
import { CreateUsuarioDto } from '../dtos/create-usuario.dto.js';
import { UpdateUsuarioDto } from '../dtos/update-usuario.dto.js';

export abstract class UsuarioRepository {
  abstract getAll(count?: number): Promise<Usuario[]>;
  abstract getById(idUsuario: number): Promise<Usuario | null>;
  abstract getByCorreo(correo: string): Promise<Usuario | null>;
  abstract getByIdentificacion(identificacion: string): Promise<Usuario | null>;
  abstract getByRol(idRol: number): Promise<Usuario[]>;
  abstract create(dto: CreateUsuarioDto): Promise<Usuario>;
  abstract update(idUsuario: number, dto: UpdateUsuarioDto): Promise<Usuario | null>;
  abstract setActivo(idUsuario: number, activo: boolean): Promise<Usuario | null>;
}
