import { RequestUser } from '../../../presentation/types/express.js';
import { DocumentoAdjunto } from '../../../domain/entities/documento-adjunto.entity.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { DocumentoAdjuntoRepository } from '../../../domain/repositories/documento-adjunto.repository.js';
import { PqrRepository } from '../../../domain/repositories/pqr.repository.js';

/**
 * Caso de uso: Consultar los documentos adjuntos de una PQR.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
export class GetDocumentosByPqrUseCase {
  constructor(
    private readonly pqrRepository: PqrRepository,
    private readonly documentoRepository: DocumentoAdjuntoRepository
  ) {}

  async execute(
    idPqr: number,
    actor?: RequestUser,
    codigoSeguimiento?: string
  ): Promise<DocumentoAdjunto[]> {
    const pqr = await this.pqrRepository.findById(idPqr);
    if (!pqr) {
      throw CustomError.notFound(`La PQR con ID ${idPqr} no existe`);
    }

    // Comprobación de permisos
    if (actor) {
      if (actor.rol === 'Solicitante' && pqr.idSolicitante && pqr.idSolicitante !== actor.idUsuario) {
        throw CustomError.forbidden('No tiene permisos para consultar los documentos de esta PQR');
      }
      if (actor.rol === 'Responsable' && pqr.idResponsable && pqr.idResponsable !== actor.idUsuario) {
        throw CustomError.forbidden('Solo puede consultar los soportes de casos asignados a su despacho');
      }
      // Analista SIAU y Directivo tienen permiso de lectura
    } else {
      // Acceso sin sesión: requiere coincidencia exacta del código de seguimiento
      if (!codigoSeguimiento || codigoSeguimiento.trim().toUpperCase() !== pqr.codigoSeguimiento.toUpperCase()) {
        throw CustomError.unauthorized('Debe iniciar sesión o suministrar el código de seguimiento válido');
      }
    }

    return this.documentoRepository.findByPqrId(idPqr);
  }
}
