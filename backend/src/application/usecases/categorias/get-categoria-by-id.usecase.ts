import { Categoria } from '../../../domain/entities/categoria.entity.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { CategoriaRepository } from '../../../domain/repositories/categoria.repository.js';

export class GetCategoriaByIdUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  async execute(idCategoria: number): Promise<Categoria> {
    if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
      throw CustomError.badRequest('ID de categoria invalido');
    }

    const categoria = await this.categoriaRepository.getById(idCategoria);
    if (!categoria) {
      throw CustomError.notFound(`Categoria con ID ${idCategoria} no encontrada`);
    }

    return categoria;
  }
}
