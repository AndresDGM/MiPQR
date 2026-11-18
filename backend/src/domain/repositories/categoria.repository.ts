import { Categoria } from '../entities/categoria.entity.js';

export abstract class CategoriaRepository {
  abstract getAll(): Promise<Categoria[]>;
  abstract getById(idCategoria: number): Promise<Categoria | null>;
}
