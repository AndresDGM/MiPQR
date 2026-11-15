import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PqrAttachment } from '../../../domain/models/pqr-attachment.model';

/**
 * Datasource remoto para la gestión de documentos adjuntos contra el backend Node.js.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class PqrAttachmentRemoteDatasource {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = environment.baseUrlNode;

  upload(idPqr: number, files: File[]): Observable<PqrAttachment[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }
    return this.httpClient.post<PqrAttachment[]>(
      `${this.baseUrl}/api/pqrs/${idPqr}/attachments`,
      formData
    );
  }

  getByPqrId(idPqr: number, codigoSeguimiento?: string): Observable<PqrAttachment[]> {
    let params = new HttpParams();
    if (codigoSeguimiento) {
      params = params.set('codigo', codigoSeguimiento.trim());
    }
    return this.httpClient.get<PqrAttachment[]>(
      `${this.baseUrl}/api/pqrs/${idPqr}/attachments`,
      { params }
    );
  }

  getDownloadBlob(idAdjunto: number, codigoSeguimiento?: string): Observable<Blob> {
    let params = new HttpParams();
    if (codigoSeguimiento) {
      params = params.set('codigo', codigoSeguimiento.trim());
    }
    return this.httpClient.get(`${this.baseUrl}/api/attachments/${idAdjunto}`, {
      params,
      responseType: 'blob',
    });
  }

  delete(idAdjunto: number): Observable<boolean> {
    return this.httpClient
      .delete<{ success: boolean }>(`${this.baseUrl}/api/attachments/${idAdjunto}`)
      .pipe(map((res) => res.success ?? true));
  }
}
