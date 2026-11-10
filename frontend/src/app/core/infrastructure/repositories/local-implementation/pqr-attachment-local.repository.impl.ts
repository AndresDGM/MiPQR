import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrAttachment } from '../../../domain/models/pqr-attachment.model';
import { PqrAttachmentRepository } from '../../../domain/repositories/pqr-attachment.repository';
import { PqrAttachmentLocalDatasource } from '../../datasources/local/pqr-attachment-local.datasource';

/**
 * Implementación local del repositorio de documentos adjuntos.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class PqrAttachmentLocalRepositoryImpl extends PqrAttachmentRepository {
  private dataSource = inject(PqrAttachmentLocalDatasource);

  upload(idPqr: number, files: File[]): Observable<PqrAttachment[]> {
    return this.dataSource.upload(idPqr, files);
  }

  getByPqrId(idPqr: number): Observable<PqrAttachment[]> {
    return this.dataSource.getByPqrId(idPqr);
  }

  getDownloadBlob(idAdjunto: number): Observable<Blob> {
    return this.dataSource.getDownloadBlob(idAdjunto);
  }

  delete(idAdjunto: number): Observable<boolean> {
    return this.dataSource.delete(idAdjunto);
  }
}
