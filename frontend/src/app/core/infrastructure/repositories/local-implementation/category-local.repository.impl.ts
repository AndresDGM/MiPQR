import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../../../domain/models/category.model';
import { CategoryRepository } from '../../../domain/repositories/category.repository';
import { CategoryLocalDatasource } from '../../datasources/local/category-local.datasource';

/**
 * Implementación local del repositorio de categorías.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class CategoryLocalRepositoryImpl extends CategoryRepository {
  private dataSource = inject(CategoryLocalDatasource);

  getAll(): Observable<Category[]> {
    return this.dataSource.getAll();
  }

  getById(idCategoria: number): Observable<Category> {
    return this.dataSource.getById(idCategoria);
  }
}
