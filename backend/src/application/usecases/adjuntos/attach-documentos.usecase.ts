import { RequestUser } from '../../../presentation/types/express.js';
import { DocumentoAdjunto } from '../../../domain/entities/documento-adjunto.entity.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { DocumentoAdjuntoRepository } from '../../../domain/repositories/documento-adjunto.repository.js';
import { FileStorageRepository } from '../../../domain/repositories/file-storage.repository.js';
import { PqrRepository } from '../../../domain/repositories/pqr.repository.js';
import { FileValidatorService } from '../../../infrastructure/services/file-validator.service.js';

export interface FileInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface AttachDocumentosConfig {
  maxIndividualBytes: number;
  maxFilesCount: number;
  maxTotalBytes: number;
}

/**
 * Caso de uso: Adjuntar uno o varios documentos de soporte a una PQR.
 *
 * @description
 * Valida la existencia de la PQR, autoriza al actor solicitante o funcionario,
 * comprueba extensiones y firmas mágicas, persiste los archivos fuera de rutas públicas
 * y registra los metadatos en la base de datos con prevención de archivos huérfanos.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
export class AttachDocumentosUseCase {
  constructor(
    private readonly pqrRepository: PqrRepository,
    private readonly documentoRepository: DocumentoAdjuntoRepository,
    private readonly fileStorage: FileStorageRepository,
    private readonly fileValidator: FileValidatorService,
    private readonly config: AttachDocumentosConfig
  ) {}

  async execute(
    idPqr: number,
    files: FileInput[],
    actor?: RequestUser
  ): Promise<DocumentoAdjunto[]> {
    // 1. Verificar existencia de la PQR
    const pqr = await this.pqrRepository.findById(idPqr);
    if (!pqr) {
      throw CustomError.notFound(`La PQR con ID ${idPqr} no existe`);
    }

    // 2. Control de acceso y autorización
    if (actor) {
      if (actor.rol === 'Solicitante' && pqr.idSolicitante && pqr.idSolicitante !== actor.idUsuario) {
        throw CustomError.forbidden('No tiene autorización para adjuntar documentos a esta PQR');
      }
      if (actor.rol === 'Responsable' && pqr.idResponsable && pqr.idResponsable !== actor.idUsuario) {
        throw CustomError.forbidden('Solo el responsable asignado o analistas SIAU pueden adjuntar soportes');
      }
    } else {
      // Usuario público o anónimo: solo puede adjuntar si el caso está en radicación inicial ('Recibida')
      if (pqr.estado !== 'Recibida') {
        throw CustomError.unauthorized('Se requiere inicio de sesión para modificar esta solicitud');
      }
    }

    // 3. Validar lote completo (cantidad y tamaño total)
    this.fileValidator.validateBatch(files, this.config.maxFilesCount, this.config.maxTotalBytes);

    const savedFiles: string[] = [];
    const createdAdjuntos: DocumentoAdjunto[] = [];

    try {
      for (const file of files) {
        // Validación profunda de MIME type, extensión y número mágico
        const { normalizedExtension, detectedMime } = this.fileValidator.validateFile(
          file,
          this.config.maxIndividualBytes
        );

        // Guardar físicamente en el almacenamiento seguro
        const stored = await this.fileStorage.save(file.buffer, normalizedExtension);
        savedFiles.push(stored.rutaArchivo);

        // Registrar metadatos en base de datos
        const adjunto = await this.documentoRepository.create({
          idPqr,
          nombreOriginal: file.originalname.slice(0, 250),
          nombreInterno: stored.nombreInterno,
          extension: normalizedExtension,
          mimeType: detectedMime,
          tamanoBytes: file.size,
          rutaArchivo: stored.rutaArchivo,
          idUsuario: actor ? actor.idUsuario : pqr.idSolicitante ?? null,
        });

        createdAdjuntos.push(adjunto);
      }

      return createdAdjuntos;
    } catch (error) {
      // En caso de fallo a mitad de la operación, revertir los archivos físicos guardados para evitar archivos huérfanos
      for (const filePath of savedFiles) {
        await this.fileStorage.delete(filePath).catch(() => {});
      }
      throw error;
    }
  }
}
