export interface NotificacionEmailRecord {
  enviado: boolean;
  estado: 'ENVIADO' | 'PENDIENTE' | 'FALLIDO' | 'SIMULADO';
  simulated?: boolean;
  mensaje?: string;
}

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
  // Campos IA
  categoriaSugeridaIa?: string | null;
  confianzaIa?: number | null;
  estadoRevisionIa?: 'PENDIENTE' | 'CONFIRMADA' | 'MODIFICADA';
  fechaClasificacionIa?: Date | null;
  versionModeloIa?: string | null;
  idUsuarioRevisionIa?: number | null;
  notificacionEmail?: NotificacionEmailRecord;
}

export type PqrStatusName =
  | 'Recibida'
  | 'En revision'
  | 'Asignada'
  | 'En gestion'
  | 'Respondida'
  | 'Cerrada';

export interface PqrHistoryRecord {
  idHistorial: number;
  idPqr: number;
  idUsuario: number | null;
  nombreUsuario?: string | null;
  idEstado: number;
  estado: PqrStatusName;
  accion: string;
  observacion: string;
  fecha: Date;
}

export interface PqrResponseRecord {
  idRespuesta: number;
  idPqr: number;
  idUsuario: number | null;
  nombreUsuario?: string | null;
  contenido: string;
  fechaRespuesta: Date;
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
  categoriaSugeridaIa?: string | null;
  confianzaIa?: number | null;
  versionModeloIa?: string | null;
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
  abstract assignResponsable(idPqr: number, idResponsable: number): Promise<PqrRecord>;
  abstract updateCategoria(
    idPqr: number,
    idCategoria: number,
    categoria: string,
    estadoRevisionIa: 'CONFIRMADA' | 'MODIFICADA',
    idUsuarioRevision?: number | null
  ): Promise<PqrRecord>;
  abstract updateEstado(
    idPqr: number,
    idEstado: number,
    estado: PqrStatusName,
    idUsuario?: number | null,
    observacion?: string
  ): Promise<PqrRecord>;
  abstract getHistorial(idPqr: number): Promise<PqrHistoryRecord[]>;
  abstract responder(idPqr: number, idUsuario: number, contenido: string): Promise<PqrResponseRecord>;
}
