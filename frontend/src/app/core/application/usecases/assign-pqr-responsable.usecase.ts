import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pqr } from '../../domain/models/pqr.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para asignar un responsable a una PQR.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * private assignPqrResponsableUseCase = inject(AssignPqrResponsableUseCase);
 *
 * this.assignPqrResponsableUseCase.execute(idPqr, idResponsable).subscribe(pqr => { ... });
 * ```
 */
@Injectable()
export class AssignPqrResponsableUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Asigna el responsable a la PQR.
   *
   * @param idPqr Identificador de la PQR
   * @param idResponsable Identificador del usuario responsable asignado
   * @returns Observable con la {@link Pqr} actualizada
   */
  execute(idPqr: number, idResponsable: number): Observable<Pqr> {
    return this.pqrRepository.assignResponsable(idPqr, idResponsable);
  }
}

