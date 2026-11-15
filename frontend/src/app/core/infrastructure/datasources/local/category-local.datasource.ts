import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { CategoryNotFoundError } from '../../../domain/errors';
import { Category } from '../../../domain/models/category.model';

/**
 * Datasource local en memoria para la entidad Category.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class CategoryLocalDatasource {
  private categories: Category[] = [
    { idCategoria: 1, nombre: 'Consulta Externa', descripcion: 'Atención médica general y con especialistas.', activa: true },
    { idCategoria: 2, nombre: 'Urgencias', descripcion: 'Atención de emergencias y triage médico.', activa: true },
    { idCategoria: 3, nombre: 'Farmacia y Medicamentos', descripcion: 'Dispensación y entrega de fórmulas médicas.', activa: true },
    { idCategoria: 4, nombre: 'Facturación y Copagos', descripcion: 'Liquidación de cuentas, cobros y autorizaciones EPS.', activa: true },
    { idCategoria: 5, nombre: 'Laboratorio e Imágenes', descripcion: 'Toma de muestras y entrega de resultados.', activa: true },
  ];

  getAll(): Observable<Category[]> {
    return of([...this.categories]).pipe(delay(150));
  }

  getById(idCategoria: number): Observable<Category> {
    const item = this.categories.find((c) => c.idCategoria === idCategoria);
    if (!item) {
      return throwError(() => new CategoryNotFoundError(idCategoria));
    }
    return of({ ...item }).pipe(delay(150));
  }

  /**
   * Helper síncrono para generación de mocks cruzados.
   */
  getCategoriesSync(): Category[] {
    return [...this.categories];
  }
}
