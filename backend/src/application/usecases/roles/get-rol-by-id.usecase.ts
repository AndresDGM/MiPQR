import { Rol } from '../../../domain/entities/rol.entity.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { RolRepository } from '../../../domain/repositories/rol.repository.js';

export class GetRolByIdUseCase {
  constructor(private readonly rolRepository: RolRepository) {}

  async execute(idRol: number): Promise<Rol> {
    const rol = await this.rolRepository.getById(idRol);
    if (!rol) {
      throw CustomError.notFound('Rol no encontrado');
    }
    return rol;
  }
}
