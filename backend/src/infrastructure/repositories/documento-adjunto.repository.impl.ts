import { DocumentoAdjunto } from '../../domain/entities/documento-adjunto.entity.js';
import {
  CreateDocumentoAdjuntoData,
  DocumentoAdjuntoRepository,
} from '../../domain/repositories/documento-adjunto.repository.js';
import { DocumentoAdjuntoDatasource } from '../datasources/documento-adjunto.datasource.js';

/**
 * Implementación concreta del repositorio de documentos adjuntos.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export class DocumentoAdjuntoRepositoryImpl extends DocumentoAdjuntoRepository {
  constructor(private readonly datasource: DocumentoAdjuntoDatasource) {
    super();
  }

  create(data: CreateDocumentoAdjuntoData): Promise<DocumentoAdjunto> {
    return this.datasource.create(data);
  }

  findByPqrId(idPqr: number): Promise<DocumentoAdjunto[]> {
    return this.datasource.findByPqrId(idPqr);
  }

  findById(idAdjunto: number): Promise<DocumentoAdjunto | null> {
    return this.datasource.findById(idAdjunto);
  }

  delete(idAdjunto: number): Promise<boolean> {
    return this.datasource.delete(idAdjunto);
  }
}
