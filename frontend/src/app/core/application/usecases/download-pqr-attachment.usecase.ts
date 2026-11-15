import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrAttachmentRepository } from '../../domain/repositories/pqr-attachment.repository';

/**
 * Caso de uso: Descargar o recuperar el Blob binario de un documento de soporte.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class DownloadPqrAttachmentUseCase {
  private repository = inject(PqrAttachmentRepository);

  execute(idAdjunto: number, codigoSeguimiento?: string): Observable<Blob> {
    return this.repository.getDownloadBlob(idAdjunto, codigoSeguimiento);
  }
}
