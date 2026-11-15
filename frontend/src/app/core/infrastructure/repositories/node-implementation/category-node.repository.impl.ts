import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../../../domain/models/category.model';
import { CategoryRepository } from '../../../domain/repositories/category.repository';
import { CategoryRemoteDatasource } from '../../datasources/remote/category-remote.datasource';

/**
 * Implementación del repositorio de categorías para backend Node.js.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class CategoryNodeRepositoryImpl extends CategoryRepository {
  private dataSource = inject(CategoryRemoteDatasource);

  getAll(): Observable<Category[]> {
    return this.dataSource.getAll();
  }

  getById(idCategoria: number): Observable<Category> {
    return this.dataSource.getById(idCategoria);
  }
}
