import { Rol } from '../../domain/entities/rol.entity.js';
import { RolRepository } from '../../domain/repositories/rol.repository.js';
import { RolDatasource } from '../datasources/rol.datasource.js';

export class RolRepositoryImpl extends RolRepository {
  constructor(private readonly datasource: RolDatasource) {
    super();
  }

  async getAll(): Promise<Rol[]> {
    return this.datasource.getAll();
  }

  async getById(idRol: number): Promise<Rol | null> {
    return this.datasource.getById(idRol);
  }

  async getByNombre(nombre: string): Promise<Rol | null> {
    return this.datasource.getByNombre(nombre);
  }
}
