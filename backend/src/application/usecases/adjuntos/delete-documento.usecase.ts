import { RequestUser } from '../../../presentation/types/express.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { DocumentoAdjuntoRepository } from '../../../domain/repositories/documento-adjunto.repository.js';
import { FileStorageRepository } from '../../../domain/repositories/file-storage.repository.js';
import { PqrRepository } from '../../../domain/repositories/pqr.repository.js';

/**
 * Caso de uso: Eliminar un documento adjunto previamente cargado.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
export class DeleteDocumentoUseCase {
  constructor(
    private readonly documentoRepository: DocumentoAdjuntoRepository,
    private readonly pqrRepository: PqrRepository,
    private readonly fileStorage: FileStorageRepository
  ) {}

  async execute(idAdjunto: number, actor: RequestUser): Promise<boolean> {
    const adjunto = await this.documentoRepository.findById(idAdjunto);
    if (!adjunto) {
      throw CustomError.notFound(`Documento adjunto con ID ${idAdjunto} no encontrado`);
    }

    const pqr = await this.pqrRepository.findById(adjunto.idPqr);
    if (!pqr) {
      throw CustomError.notFound('La PQR asociada ya no existe');
    }

    // Reglas de autorización para eliminación:
    // 1. Analista SIAU puede retirar anexos con fines de saneamiento administrativo
    // 2. Solicitante solo puede eliminar sus propios anexos si la PQR sigue en estado 'Recibida'
    if (actor.rol === 'Solicitante') {
      if (adjunto.idUsuario !== actor.idUsuario && pqr.idSolicitante !== actor.idUsuario) {
        throw CustomError.forbidden('No puede eliminar documentos subidos por otro usuario');
      }
      if (pqr.estado !== 'Recibida') {
        throw CustomError.badRequest('No se pueden eliminar soportes de una PQR en trámite o cerrada');
      }
    } else if (actor.rol !== 'Analista SIAU' && actor.rol !== 'Directivo') {
      throw CustomError.forbidden('Su rol no tiene autorización para eliminar documentos adjuntos');
    }

    // 1. Eliminar de la base de datos
    const deleted = await this.documentoRepository.delete(idAdjunto);

    // 2. Eliminar físicamente del almacenamiento
    await this.fileStorage.delete(adjunto.rutaArchivo);

    return deleted;
  }
}
