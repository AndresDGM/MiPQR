import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pqr } from '../../domain/models/pqr.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para obtener el listado de todas las solicitudes PQR.
 *
 * @description
 * Pertenece a la **capa de Aplicación**. Coordina la recuperación de las PQR
 * registradas en el sistema delegando la operación al contrato `PqrRepository`.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * private getAllPqrsUseCase = inject(GetAllPqrsUseCase);
 *
 * this.getAllPqrsUseCase.execute(10).subscribe(pqrs => {
 *   this.pqrs = pqrs;
 * });
 * ```
 *
 * @see {@link Pqr}
 * @see {@link PqrRepository}
 */
@Injectable()
export class GetAllPqrsUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Ejecuta el caso de uso para obtener las PQR.
   *
   * @param limit Cantidad máxima opcional de solicitudes a recuperar
   * @returns Observable con el listado de {@link Pqr}
   */
  execute(limit?: number): Observable<Pqr[]> {
    return this.pqrRepository.getAll(limit);
  }
}

