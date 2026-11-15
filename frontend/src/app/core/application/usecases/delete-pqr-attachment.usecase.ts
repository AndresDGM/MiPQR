import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrAttachmentRepository } from '../../domain/repositories/pqr-attachment.repository';

/**
 * Caso de uso: Eliminar un documento adjunto previamente cargado.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class DeletePqrAttachmentUseCase {
  private repository = inject(PqrAttachmentRepository);

  execute(idAdjunto: number): Observable<boolean> {
    return this.repository.delete(idAdjunto);
  }
}
