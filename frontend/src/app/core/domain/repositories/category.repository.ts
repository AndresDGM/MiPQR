import { Observable } from 'rxjs';
import { Category } from '../models/category.model';

/**
 * Contrato del repositorio de categorías de PQR.
 *
 * @description
 * Define el acceso a los datos de las categorías para la clasificación
 * y parametrización de las solicitudes.
 *
 * @architecture Clean Architecture
 * @layer Domain
 *
 * @example
 * ```ts
 * private categoryRepository = inject(CategoryRepository);
 * ```
 *
 * @see {@link Category}
 */
export abstract class CategoryRepository {

  /**
   * Obtiene todas las categorías activas para el registro y clasificación.
   *
   * @returns Observable que emite un arreglo de {@link Category}
   */
  abstract getAll(): Observable<Category[]>;

  /**
   * Obtiene una categoría por su identificador único.
   *
   * @param idCategoria Identificador de la categoría
   * @returns Observable que emite la {@link Category}
   */
  abstract getById(idCategoria: number): Observable<Category>;
}

