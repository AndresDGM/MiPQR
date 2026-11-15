import { Rol } from '../entities/rol.entity.js';

export abstract class RolRepository {
  abstract getAll(): Promise<Rol[]>;
  abstract getById(idRol: number): Promise<Rol | null>;
  abstract getByNombre(nombre: string): Promise<Rol | null>;
}
