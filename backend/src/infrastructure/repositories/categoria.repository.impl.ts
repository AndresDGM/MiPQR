import { Categoria } from '../../domain/entities/categoria.entity.js';
import { CategoriaRepository } from '../../domain/repositories/categoria.repository.js';
import { CategoriaDatasource } from '../datasources/categoria.datasource.js';

export class CategoriaRepositoryImpl extends CategoriaRepository {
  constructor(private readonly categoriaDatasource: CategoriaDatasource) {
    super();
  }

  getAll(): Promise<Categoria[]> {
    return this.categoriaDatasource.getAll();
  }

  getById(idCategoria: number): Promise<Categoria | null> {
    return this.categoriaDatasource.getById(idCategoria);
  }
}
