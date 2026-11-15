import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../../domain/models/category.model';
import { CategoryRepository } from '../../domain/repositories/category.repository';

/**
 * Caso de uso para obtener el catálogo de categorías activas de PQR.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class GetAllCategoriesUseCase {
  private categoryRepository = inject(CategoryRepository);

  /**
   * Ejecuta el caso de uso para listar categorías.
   *
   * @returns Observable con el arreglo de {@link Category}
   */
  execute(): Observable<Category[]> {
    return this.categoryRepository.getAll();
  }
}
