import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrAttachment } from '../../domain/models/pqr-attachment.model';
import { PqrAttachmentRepository } from '../../domain/repositories/pqr-attachment.repository';

/**
 * Caso de uso: Cargar y vincular documentos de soporte a una PQR.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class UploadPqrAttachmentsUseCase {
  private repository = inject(PqrAttachmentRepository);

  execute(idPqr: number, files: File[]): Observable<PqrAttachment[]> {
    return this.repository.upload(idPqr, files);
  }
}
