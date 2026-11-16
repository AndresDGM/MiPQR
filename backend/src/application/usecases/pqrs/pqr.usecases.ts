import { CreatePqrData, PqrRecord, PqrRepository } from '../../../domain/repositories/pqr.repository.js';
import { PQRClassificationRepository } from '../../../domain/repositories/pqr-classification.repository.js';
import { CustomError } from '../../../domain/errors/custom.error.js';

export class GetAllPqrsBackendUseCase {
  constructor(private readonly repository: PqrRepository) {}
  execute(limit?: number): Promise<PqrRecord[]> {
    return this.repository.getAll(limit);
  }
}

export class GetPqrByIdBackendUseCase {
  constructor(private readonly repository: PqrRepository) {}
  async execute(idPqr: number): Promise<PqrRecord> {
    const pqr = await this.repository.findById(idPqr);
    if (!pqr) throw CustomError.notFound(`PQR con ID ${idPqr} no encontrada`);
    return pqr;
  }
}

export class GetPqrByCodigoBackendUseCase {
  constructor(private readonly repository: PqrRepository) {}
  async execute(codigo: string): Promise<PqrRecord> {
    const pqr = await this.repository.findByCodigo(codigo);
    if (!pqr) throw CustomError.notFound(`No se encontró ninguna PQR con el código "${codigo}"`);
    return pqr;
  }
}

export class CreatePqrBackendUseCase {
  constructor(
    private readonly repository: PqrRepository,
    private readonly classificationRepo?: PQRClassificationRepository
  ) {}

  async execute(data: CreatePqrData): Promise<PqrRecord> {
    if (!data.categoriaSugeridaIa && this.classificationRepo) {
      try {
        const text = `${data.asunto} ${data.descripcion}`.trim();
        const suggestion = await this.classificationRepo.classify(text);
        if (suggestion) {
          data.categoriaSugeridaIa = suggestion.categoriaPredicha;
          data.confianzaIa = suggestion.confianza;
          data.versionModeloIa = suggestion.versionModelo;
        }
      } catch {
        // En caso de fallo o timeout de la IA, la radicación de la PQR continúa sin bloqueo
      }
    }
    return this.repository.create(data);
  }
}

export interface UpdateCategoriaDTO {
  idPqr: number;
  idCategoria: number;
  categoria: string;
  estadoRevisionIa: 'CONFIRMADA' | 'MODIFICADA';
  idUsuarioRevision?: number | null;
}

export class UpdatePqrCategoriaUseCase {
  constructor(private readonly repository: PqrRepository) {}

  async execute(dto: UpdateCategoriaDTO): Promise<PqrRecord> {
    const pqr = await this.repository.findById(dto.idPqr);
    if (!pqr) {
      throw CustomError.notFound(`PQR con ID ${dto.idPqr} no encontrada`);
    }

    if (!dto.idCategoria || !dto.categoria) {
      throw CustomError.badRequest('Se debe especificar la categoría y su identificador');
    }

    if (!['CONFIRMADA', 'MODIFICADA'].includes(dto.estadoRevisionIa)) {
      throw CustomError.badRequest('El estado de revisión debe ser CONFIRMADA o MODIFICADA');
    }

    return this.repository.updateCategoria(
      dto.idPqr,
      dto.idCategoria,
      dto.categoria,
      dto.estadoRevisionIa,
      dto.idUsuarioRevision
    );
  }
}
