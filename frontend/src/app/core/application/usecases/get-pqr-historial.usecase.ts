import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrHistory } from '../../domain/models/pqr-history.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para obtener el historial de trazabilidad de una PQR.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * private getPqrHistorialUseCase = inject(GetPqrHistorialUseCase);
 *
 * this.getPqrHistorialUseCase.execute(idPqr).subscribe(historial => { ... });
 * ```
 */
@Injectable()
export class GetPqrHistorialUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Obtiene la cronología de eventos de la PQR.
   *
   * @param idPqr Identificador de la PQR
   * @returns Observable con el arreglo de {@link PqrHistory}
   */
  execute(idPqr: number): Observable<PqrHistory[]> {
    return this.pqrRepository.getHistorial(idPqr);
  }
}

