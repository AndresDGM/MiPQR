import { PqrStatusName } from './pqr.model';

/**
 * Interfaz que representa un registro de trazabilidad o historial de una PQR.
 *
 * @description
 * Modela cada evento, cambio de estado, asignación o comentario realizado
 * sobre una PQR, garantizando la auditoría y seguimiento transparente.
 *
 * @example
 * ```ts
 * const registro: PqrHistory = {
 *   idHistorial: 1,
 *   idPqr: 5,
 *   idUsuario: 2,
 *   nombreUsuario: 'Carolina Restrepo (SIAU)',
 *   idEstado: 3,
 *   estado: 'Asignada',
 *   accion: 'Asignación de caso',
 *   observacion: 'Caso remitido al departamento de Facturación para auditoría.',
 *   fecha: '2026-10-28T16:00:00Z'
 * };
 * ```
 */
export interface PqrHistory {
  /** Identificador único del evento en el historial */
  idHistorial: number;

  /** Identificador de la PQR a la que pertenece el evento */
  idPqr: number;

  /** Identificador del usuario que ejecutó la acción */
  idUsuario: number;

  /** Nombre del usuario que ejecutó la acción */
  nombreUsuario?: string;

  /** Identificador del estado resultante */
  idEstado: number;

  /** Nombre legible del estado resultante */
  estado?: PqrStatusName;

  /** Acción realizada (ej: 'Radicación', 'Cambio de estado', 'Asignación', 'Cierre') */
  accion: string;

  /** Comentarios, justificación o detalles del cambio */
  observacion: string;

  /** Fecha y hora exacta en la que se produjo la acción en formato ISO */
  fecha: string;
}

