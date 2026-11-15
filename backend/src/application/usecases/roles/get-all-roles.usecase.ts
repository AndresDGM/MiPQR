import { Rol } from '../../../domain/entities/rol.entity.js';
import { RolRepository } from '../../../domain/repositories/rol.repository.js';

export class GetAllRolesUseCase {
  constructor(private readonly rolRepository: RolRepository) {}

  async execute(): Promise<Rol[]> {
    return this.rolRepository.getAll();
  }
}
