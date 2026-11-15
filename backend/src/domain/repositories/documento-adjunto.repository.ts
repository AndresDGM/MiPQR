import { DocumentoAdjunto } from '../entities/documento-adjunto.entity.js';

export interface CreateDocumentoAdjuntoData {
  idPqr: number;
  nombreOriginal: string;
  nombreInterno: string;
  extension: string;
  mimeType: string;
  tamanoBytes: number;
  rutaArchivo: string;
  idUsuario?: number | null;
}

/**
 * Contrato de repositorio para la persistencia de metadatos de documentos adjuntos.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class DocumentoAdjuntoRepository {
  abstract create(data: CreateDocumentoAdjuntoData): Promise<DocumentoAdjunto>;
  abstract findByPqrId(idPqr: number): Promise<DocumentoAdjunto[]>;
  abstract findById(idAdjunto: number): Promise<DocumentoAdjunto | null>;
  abstract delete(idAdjunto: number): Promise<boolean>;
}
