import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Category } from '../../../domain/models/category.model';

/**
 * Datasource remoto para la entidad Category hacia el backend Node.js.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class CategoryRemoteDatasource {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = environment.baseUrlNode;

  getAll(): Observable<Category[]> {
    return this.httpClient.get<Category[]>(`${this.baseUrl}/api/categories`);
  }

  getById(idCategoria: number): Observable<Category> {
    return this.httpClient.get<Category>(`${this.baseUrl}/api/categories/${idCategoria}`);
  }
}
