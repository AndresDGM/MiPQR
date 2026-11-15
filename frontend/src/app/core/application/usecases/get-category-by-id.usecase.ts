import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../../domain/models/category.model';
import { CategoryRepository } from '../../domain/repositories/category.repository';

/**
 * Caso de uso para obtener una categoría específica por ID.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class GetCategoryByIdUseCase {
  private categoryRepository = inject(CategoryRepository);

  /**
   * Ejecuta el caso de uso para buscar una categoría por ID.
   *
   * @param idCategoria Identificador numérico de la categoría
   * @returns Observable con la {@link Category}
   */
  execute(idCategoria: number): Observable<Category> {
    return this.categoryRepository.getById(idCategoria);
  }
}
