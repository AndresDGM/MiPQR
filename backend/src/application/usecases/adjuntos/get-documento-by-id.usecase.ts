import { RequestUser } from '../../../presentation/types/express.js';
import { DocumentoAdjunto } from '../../../domain/entities/documento-adjunto.entity.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { DocumentoAdjuntoRepository } from '../../../domain/repositories/documento-adjunto.repository.js';
import { FileStorageRepository } from '../../../domain/repositories/file-storage.repository.js';
import { PqrRepository } from '../../../domain/repositories/pqr.repository.js';

export interface DocumentoDownloadResult {
  adjunto: DocumentoAdjunto;
  absolutePath: string;
}

/**
 * Caso de uso: Obtener y descargar o visualizar un documento adjunto por su identificador único.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
export class GetDocumentoByIdUseCase {
  constructor(
    private readonly documentoRepository: DocumentoAdjuntoRepository,
    private readonly pqrRepository: PqrRepository,
    private readonly fileStorage: FileStorageRepository
  ) {}

  async execute(
    idAdjunto: number,
    actor?: RequestUser,
    codigoSeguimiento?: string
  ): Promise<DocumentoDownloadResult> {
    const adjunto = await this.documentoRepository.findById(idAdjunto);
    if (!adjunto) {
      throw CustomError.notFound(`Documento adjunto con ID ${idAdjunto} no encontrado`);
    }

    const pqr = await this.pqrRepository.findById(adjunto.idPqr);
    if (!pqr) {
      throw CustomError.notFound('La PQR asociada al documento no existe');
    }

    // Validación de autorización
    if (actor) {
      if (actor.rol === 'Solicitante' && pqr.idSolicitante && pqr.idSolicitante !== actor.idUsuario) {
        throw CustomError.forbidden('No tiene permiso para descargar este documento');
      }
      if (actor.rol === 'Responsable' && pqr.idResponsable && pqr.idResponsable !== actor.idUsuario) {
        throw CustomError.forbidden('No está autorizado para descargar este soporte');
      }
    } else {
      if (!codigoSeguimiento || codigoSeguimiento.trim().toUpperCase() !== pqr.codigoSeguimiento.toUpperCase()) {
        throw CustomError.unauthorized('Debe iniciar sesión o suministrar el código de seguimiento válido');
      }
    }

    // Comprobar existencia en almacenamiento físico
    const exists = await this.fileStorage.exists(adjunto.rutaArchivo);
    if (!exists) {
      throw CustomError.notFound('El archivo físico no se encuentra disponible en el servidor de almacenamiento');
    }

    return {
      adjunto,
      absolutePath: this.fileStorage.getAbsolutePath(adjunto.rutaArchivo),
    };
  }
}
