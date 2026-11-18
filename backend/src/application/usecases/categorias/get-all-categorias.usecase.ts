import { Categoria } from '../../../domain/entities/categoria.entity.js';
import { CategoriaRepository } from '../../../domain/repositories/categoria.repository.js';

export class GetAllCategoriasUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  execute(): Promise<Categoria[]> {
    return this.categoriaRepository.getAll();
  }
}
