import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrAttachment } from '../../../domain/models/pqr-attachment.model';
import { PqrAttachmentRepository } from '../../../domain/repositories/pqr-attachment.repository';
import { PqrAttachmentRemoteDatasource } from '../../datasources/remote/pqr-attachment-remote.datasource';

/**
 * Implementación Node.js/Remota del repositorio de documentos adjuntos.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class PqrAttachmentNodeRepositoryImpl extends PqrAttachmentRepository {
  private dataSource = inject(PqrAttachmentRemoteDatasource);

  upload(idPqr: number, files: File[]): Observable<PqrAttachment[]> {
    return this.dataSource.upload(idPqr, files);
  }

  getByPqrId(idPqr: number, codigoSeguimiento?: string): Observable<PqrAttachment[]> {
    return this.dataSource.getByPqrId(idPqr, codigoSeguimiento);
  }

  getDownloadBlob(idAdjunto: number, codigoSeguimiento?: string): Observable<Blob> {
    return this.dataSource.getDownloadBlob(idAdjunto, codigoSeguimiento);
  }

  delete(idAdjunto: number): Observable<boolean> {
    return this.dataSource.delete(idAdjunto);
  }
}
