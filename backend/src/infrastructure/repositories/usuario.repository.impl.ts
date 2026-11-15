import { CreateUsuarioDto } from '../../domain/dtos/create-usuario.dto.js';
import { UpdateUsuarioDto } from '../../domain/dtos/update-usuario.dto.js';
import { Usuario } from '../../domain/entities/usuario.entity.js';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository.js';
import { UsuarioDatasource } from '../datasources/usuario.datasource.js';

export class UsuarioRepositoryImpl extends UsuarioRepository {
  constructor(private readonly datasource: UsuarioDatasource) {
    super();
  }

  async getAll(count?: number): Promise<Usuario[]> {
    return this.datasource.getAll(count);
  }

  async getById(idUsuario: number): Promise<Usuario | null> {
    return this.datasource.getById(idUsuario);
  }

  async getByCorreo(correo: string): Promise<Usuario | null> {
    return this.datasource.getByCorreo(correo);
  }

  async getByIdentificacion(identificacion: string): Promise<Usuario | null> {
    return this.datasource.getByIdentificacion(identificacion);
  }

  async getByRol(idRol: number): Promise<Usuario[]> {
    return this.datasource.getByRol(idRol);
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    return this.datasource.create(dto);
  }

  async update(idUsuario: number, dto: UpdateUsuarioDto): Promise<Usuario | null> {
    return this.datasource.update(idUsuario, dto);
  }

  async setActivo(idUsuario: number, activo: boolean): Promise<Usuario | null> {
    return this.datasource.setActivo(idUsuario, activo);
  }
}
