import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pqr } from '../../domain/models/pqr.model';
import { PqrRepository } from '../../domain/repositories/pqr.repository';

/**
 * Caso de uso para confirmar o modificar la categoría sugerida por el modelo de IA.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class UpdatePqrCategoriaUseCase {
  private pqrRepository = inject(PqrRepository);

  /**
   * Ejecuta la actualización o confirmación de la categoría de la PQR.
   *
   * @param idPqr Identificador de la PQR
   * @param idCategoria Identificador de la categoría seleccionada o confirmada
   * @param categoria Nombre descriptivo de la categoría
   * @param estadoRevisionIa Estado de la revisión ('CONFIRMADA' | 'MODIFICADA')
   */
  execute(
    idPqr: number,
    idCategoria: number,
    categoria: string,
    estadoRevisionIa: 'CONFIRMADA' | 'MODIFICADA'
  ): Observable<Pqr> {
    return this.pqrRepository.updateCategoria(
      idPqr,
      idCategoria,
      categoria,
      estadoRevisionIa
    );
  }
}
