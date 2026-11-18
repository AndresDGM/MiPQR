import { CustomError } from '../../../domain/errors/custom.error.js';
import { PqrHistoryRecord, PqrRepository } from '../../../domain/repositories/pqr.repository.js';

export class GetPqrHistorialUseCase {
  constructor(private readonly repository: PqrRepository) {}

  async execute(idPqr: number): Promise<PqrHistoryRecord[]> {
    const pqr = await this.repository.findById(idPqr);
    if (!pqr) {
      throw CustomError.notFound(`PQR con ID ${idPqr} no encontrada`);
    }

    return this.repository.getHistorial(idPqr);
  }
}
