import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pqr } from '../../domain/models/pqr.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para obtener el detalle de una PQR por su identificador numérico.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * private getPqrByIdUseCase = inject(GetPqrByIdUseCase);
 *
 * this.getPqrByIdUseCase.execute(1).subscribe(pqr => { ... });
 * ```
 */
@Injectable()
export class GetPqrByIdUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Ejecuta el caso de uso.
   *
   * @param idPqr Identificador único de la PQR
   * @returns Observable con la entidad {@link Pqr}
   */
  execute(idPqr: number): Observable<Pqr> {
    return this.pqrRepository.getById(idPqr);
  }
}

