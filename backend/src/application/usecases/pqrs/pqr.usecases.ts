import { CreatePqrData, PqrRecord, PqrRepository } from '../../../domain/repositories/pqr.repository.js';
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
  constructor(private readonly repository: PqrRepository) {}
  execute(data: CreatePqrData): Promise<PqrRecord> {
    return this.repository.create(data);
  }
}
