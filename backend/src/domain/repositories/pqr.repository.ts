export interface PqrRecord {
  idPqr: number;
  codigoSeguimiento: string;
  idSolicitante?: number | null;
  nombreSolicitante?: string | null;
  correoSolicitante?: string | null;
  identificacionSolicitante?: string | null;
  idCategoria: number;
  categoria: string;
  idEstado: number;
  estado: string;
  idResponsable?: number | null;
  nombreResponsable?: string | null;
  tipoPqr: string;
  asunto: string;
  descripcion: string;
  fechaRegistro: Date;
  fechaCierre?: Date | null;
}

export interface CreatePqrData {
  tipoPqr: string;
  idCategoria: number;
  asunto: string;
  descripcion: string;
  nombreSolicitante: string;
  correoSolicitante: string;
  identificacionSolicitante: string;
  idSolicitante?: number | null;
}

/**
 * Contrato de repositorio para la entidad PQR en el backend.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class PqrRepository {
  abstract getAll(limit?: number): Promise<PqrRecord[]>;
  abstract findById(idPqr: number): Promise<PqrRecord | null>;
  abstract findByCodigo(codigo: string): Promise<PqrRecord | null>;
  abstract create(data: CreatePqrData): Promise<PqrRecord>;
}
