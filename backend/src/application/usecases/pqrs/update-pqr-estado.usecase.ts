import { CustomError } from '../../../domain/errors/custom.error.js';
import { PqrRecord, PqrRepository, PqrStatusName } from '../../../domain/repositories/pqr.repository.js';

const ESTADO_TO_ID: Record<PqrStatusName, number> = {
  Recibida: 1,
  'En revision': 2,
  Asignada: 3,
  'En gestion': 4,
  Respondida: 5,
  Cerrada: 6,
};

const TRANSICIONES_VALIDAS: Record<PqrStatusName, PqrStatusName[]> = {
  Recibida: ['En revision', 'Asignada', 'Cerrada'],
  'En revision': ['Asignada', 'En gestion', 'Respondida', 'Cerrada'],
  Asignada: ['En gestion', 'Respondida', 'Cerrada'],
  'En gestion': ['Respondida', 'Cerrada'],
  Respondida: ['Cerrada', 'En gestion'],
  Cerrada: [],
};

export interface UpdateEstadoDTO {
  idPqr: number;
  estado: string;
  idUsuario?: number | null;
  observacion?: string;
}

export class UpdatePqrEstadoUseCase {
  constructor(private readonly repository: PqrRepository) {}

  async execute(dto: UpdateEstadoDTO): Promise<PqrRecord> {
    const nuevoEstado = dto.estado?.trim() as PqrStatusName;
    const idEstado = ESTADO_TO_ID[nuevoEstado];
    if (!idEstado) {
      throw CustomError.badRequest(`Estado de PQR inválido: "${dto.estado}"`);
    }

    const pqr = await this.repository.findById(dto.idPqr);
    if (!pqr) {
      throw CustomError.notFound(`PQR con ID ${dto.idPqr} no encontrada`);
    }

    const estadoActual = pqr.estado as PqrStatusName;
    if (estadoActual === 'Cerrada') {
      throw CustomError.badRequest('No es posible modificar el estado de una PQR que ya se encuentra cerrada');
    }

    if (estadoActual === nuevoEstado) {
      throw CustomError.badRequest(`La PQR ya se encuentra en estado "${nuevoEstado}"`);
    }

    const permitidos = TRANSICIONES_VALIDAS[estadoActual] ?? [];
    if (!permitidos.includes(nuevoEstado)) {
      throw CustomError.badRequest(
        `Transición de estado no permitida: "${estadoActual}" -> "${nuevoEstado}"`
      );
    }

    return this.repository.updateEstado(
      dto.idPqr,
      idEstado,
      nuevoEstado,
      dto.idUsuario ?? null,
      dto.observacion
    );
  }
}
