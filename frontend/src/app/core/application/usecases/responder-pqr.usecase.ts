import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrResponse } from '../../domain/models/pqr-response.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para emitir la respuesta formal a una PQR.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * private responderPqrUseCase = inject(ResponderPqrUseCase);
 *
 * this.responderPqrUseCase.execute(idPqr, 'Se evaluó la solicitud...').subscribe(res => { ... });
 * ```
 */
@Injectable()
export class ResponderPqrUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Registra la respuesta oficial.
   *
   * @param idPqr Identificador de la PQR a responder
   * @param contenido Mensaje oficial de respuesta
   * @returns Observable con la {@link PqrResponse} emitida
   */
  execute(idPqr: number, contenido: string): Observable<PqrResponse> {
    return this.pqrRepository.responder(idPqr, contenido);
  }
}

