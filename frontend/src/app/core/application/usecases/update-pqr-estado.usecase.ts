import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pqr, PqrStatusName } from '../../domain/models/pqr.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para realizar la transición de estado de una PQR.
 *
 * @description
 * Permite al personal SIAU o al responsable cambiar el estado de la PQR
 * (ej: de 'Recibida' a 'En revision', o a 'En gestion', etc.) registrando
 * una justificación u observación.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * private updatePqrEstadoUseCase = inject(UpdatePqrEstadoUseCase);
 *
 * this.updatePqrEstadoUseCase.execute(1, 'En revision', 'Validando documentación adjunta')
 *   .subscribe(pqrActualizada => { ... });
 * ```
 */
@Injectable()
export class UpdatePqrEstadoUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Ejecuta el cambio de estado.
   *
   * @param idPqr Identificador de la PQR
   * @param nuevoEstado Nuevo estado del ciclo de vida
   * @param observacion Motivo u observación del cambio
   * @returns Observable con la {@link Pqr} actualizada
   */
  execute(idPqr: number, nuevoEstado: PqrStatusName, observacion?: string): Observable<Pqr> {
    return this.pqrRepository.updateEstado(idPqr, nuevoEstado, observacion);
  }
}

