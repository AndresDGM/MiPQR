import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrAttachment } from '../../domain/models/pqr-attachment.model';
import { PqrAttachmentRepository } from '../../domain/repositories/pqr-attachment.repository';

/**
 * Caso de uso: Consultar los documentos adjuntos de una PQR.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class GetPqrAttachmentsUseCase {
  private repository = inject(PqrAttachmentRepository);

  execute(idPqr: number, codigoSeguimiento?: string): Observable<PqrAttachment[]> {
    return this.repository.getByPqrId(idPqr, codigoSeguimiento);
  }
}
