import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePqrPayload, Pqr } from '../../domain/models/pqr.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para radicar una nueva solicitud PQR en el sistema.
 *
 * @description
 * Recibe los datos del solicitante y de la solicitud, delegando la creación
 * y asignación del código de seguimiento al repositorio correspondiente.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * private createPqrUseCase = inject(CreatePqrUseCase);
 *
 * this.createPqrUseCase.execute(payload).subscribe(nuevaPqr => { ... });
 * ```
 */
@Injectable()
export class CreatePqrUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Ejecuta la radicación de la PQR.
   *
   * @param payload Datos de la solicitud
   * @returns Observable con la {@link Pqr} creada y radicada
   */
  execute(payload: CreatePqrPayload): Observable<Pqr> {
    return this.pqrRepository.create(payload);
  }
}

