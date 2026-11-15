/**
 * Interfaz que representa una respuesta emitida a una PQR.
 *
 * @description
 * Almacena el contenido formal redactado por el responsable o por el área SIAU
 * para dar cierre o contestación oficial a la solicitud del usuario.
 *
 * @example
 * ```ts
 * const respuesta: PqrResponse = {
 *   idRespuesta: 1,
 *   idPqr: 5,
 *   idUsuario: 2,
 *   nombreUsuario: 'Dra. Patricia Ortiz',
 *   contenido: 'Se realizó la revisión del caso con el área correspondiente...',
 *   fechaRespuesta: '2026-10-29T10:15:00Z'
 * };
 * ```
 */
export interface PqrResponse {
  /** Identificador único de la respuesta */
  idRespuesta: number;

  /** Identificador de la PQR asociada */
  idPqr: number;

  /** Identificador del usuario que redactó la respuesta */
  idUsuario: number;

  /** Nombre del autor de la respuesta */
  nombreUsuario?: string;

  /** Contenido o mensaje oficial de respuesta */
  contenido: string;

  /** Fecha y hora en la que se registró la respuesta en formato ISO */
  fechaRespuesta: string;
}

