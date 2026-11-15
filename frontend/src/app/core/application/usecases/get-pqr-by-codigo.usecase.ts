import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pqr } from '../../domain/models/pqr.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para consultar el estado y avance de una PQR mediante su código de seguimiento.
 *
 * @description
 * Es el caso de uso principal utilizado por los solicitantes/pacientes para
 * consultar la trazabilidad pública de su caso sin requerir login avanzado.
 *
 * @architecture Clean Architecture
 * @layer Application
 *
 * @example
 * ```ts
 * private getPqrByCodigoUseCase = inject(GetPqrByCodigoUseCase);
 *
 * this.getPqrByCodigoUseCase.execute('PQR-2026-001').subscribe(pqr => { ... });
 * ```
 */
@Injectable()
export class GetPqrByCodigoUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Ejecuta la consulta de la PQR por código de seguimiento.
   *
   * @param codigo Código de radicación (ej: 'PQR-2026-001')
   * @returns Observable con la entidad {@link Pqr}
   */
  execute(codigo: string): Observable<Pqr> {
    return this.pqrRepository.getByCodigoSeguimiento(codigo);
  }
}

