import { Observable } from 'rxjs';
import { PqrAttachment } from '../models/pqr-attachment.model';

/**
 * Contrato abstracto del repositorio de documentos adjuntos en el Frontend.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class PqrAttachmentRepository {
  /**
   * Adjunta uno o varios archivos a una PQR existente.
   */
  abstract upload(idPqr: number, files: File[]): Observable<PqrAttachment[]>;

  /**
   * Obtiene la lista de documentos de soporte asociados a una PQR.
   */
  abstract getByPqrId(idPqr: number, codigoSeguimiento?: string): Observable<PqrAttachment[]>;

  /**
   * Descarga o recupera el archivo binario (Blob) por su ID.
   */
  abstract getDownloadBlob(idAdjunto: number, codigoSeguimiento?: string): Observable<Blob>;

  /**
   * Elimina un documento adjunto previamente cargado.
   */
  abstract delete(idAdjunto: number): Observable<boolean>;
}
