import { CustomError } from '../../../domain/errors/custom.error.js';
import { PqrRepository, PqrResponseRecord } from '../../../domain/repositories/pqr.repository.js';

export interface ResponderPqrDTO {
  idPqr: number;
  idUsuario: number;
  contenido: string;
}

export class ResponderPqrUseCase {
  constructor(private readonly repository: PqrRepository) {}

  async execute(dto: ResponderPqrDTO): Promise<PqrResponseRecord> {
    const contenido = dto.contenido?.trim();
    if (!contenido || contenido.length < 10) {
      throw CustomError.badRequest('El contenido de la respuesta debe tener al menos 10 caracteres');
    }

    const pqr = await this.repository.findById(dto.idPqr);
    if (!pqr) {
      throw CustomError.notFound(`PQR con ID ${dto.idPqr} no encontrada`);
    }

    if (pqr.estado === 'Cerrada' || pqr.idEstado === 6) {
      throw CustomError.badRequest('No es posible responder una PQR que ya se encuentra cerrada');
    }

    return this.repository.responder(dto.idPqr, dto.idUsuario, contenido);
  }
}
