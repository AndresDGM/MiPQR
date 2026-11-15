/**
 * Tipos de solicitud PQR permitidos en el sistema.
 *
 * @remarks
 * Restringe la tipificación a los tipos válidos según la normativa y el modelo de negocio:
 * - 'Peticion': Solicitud formal de información, trámite, documento o servicio.
 * - 'Queja': Manifestación de inconformidad por una conducta irregular o atención del personal.
 * - 'Reclamo': Exigencia formal por la prestación deficiente o cobro no correspondiente.
 * - 'Sugerencia': Aporte o propuesta de mejora para los procesos y servicios.
 *
 * @example
 * ```ts
 * const tipo: PqrType = 'Queja';
 * ```
 */
export type PqrType = 'Peticion' | 'Queja' | 'Reclamo' | 'Sugerencia';

/**
 * Estados del ciclo de vida de una PQR según el flujo del MVP.
 *
 * @remarks
 * Los estados siguen la secuencia de atención definida para el proyecto:
 * - 'Recibida': Solicitud registrada y radicada en la plataforma con código de seguimiento.
 * - 'En revision': Evaluación inicial y validación por parte del analista SIAU.
 * - 'Asignada': Delegada formalmente a un área o profesional responsable.
 * - 'En gestion': Trámite o investigación activa en curso.
 * - 'Respondida': Respuesta formal emitida y disponible para el solicitante.
 * - 'Cerrada': Caso resuelto y archivado con registro histórico completo.
 *
 * @example
 * ```ts
 * const estado: PqrStatusName = 'En revision';
 * ```
 */
export type PqrStatusName =
  | 'Recibida'
  | 'En revision'
  | 'Asignada'
  | 'En gestion'
  | 'Respondida'
  | 'Cerrada';

/**
 * Interfaz que representa una PQR dentro de la capa de dominio.
 *
 * @description
 * Modela la entidad central de la plataforma MiPQR, reflejando el modelo relacional
 * del sistema y los atributos necesarios para su trazabilidad y visualización.
 *
 * @example
 * ```ts
 * const solicitud: Pqr = {
 *   idPqr: 1,
 *   codigoSeguimiento: 'PQR-2026-001',
 *   idSolicitante: 10,
 *   idCategoria: 2,
 *   idEstado: 1,
 *   estado: 'Recibida',
 *   tipoPqr: 'Queja',
 *   asunto: 'Demora en la atención de consulta',
 *   descripcion: 'Tiempo de espera superior al estimado en sala de urgencias.',
 *   fechaRegistro: '2026-10-28T14:30:00Z'
 * };
 * ```
 */
export interface Pqr {
  /** Identificador único primario de la PQR */
  idPqr: number;

  /** Código alfanumérico único para consulta y seguimiento por parte del solicitante */
  codigoSeguimiento: string;

  /** Identificador del usuario solicitante */
  idSolicitante: number;

  /** Nombre del solicitante (para componentes de presentación) */
  nombreSolicitante?: string;

  /** Correo electrónico de notificación del solicitante */
  correoSolicitante?: string;

  /** Identificador de la categoría a la que pertenece la PQR */
  idCategoria: number;

  /** Nombre descriptivo de la categoría */
  categoria?: string;

  /** Identificador del estado actual */
  idEstado: number;

  /** Nombre del estado actual del ciclo de vida */
  estado: PqrStatusName;

  /** Identificador del usuario responsable de tramitar la PQR (opcional en fase inicial) */
  idResponsable?: number;

  /** Nombre del responsable asignado */
  nombreResponsable?: string;

  /** Tipo de solicitud (Peticion, Queja, Reclamo o Sugerencia) */
  tipoPqr: PqrType;

  /** Asunto o resumen corto de la solicitud */
  asunto: string;

  /** Descripción detallada de los hechos o solicitud */
  descripcion: string;

  /** Fecha y hora de radicación en formato ISO */
  fechaRegistro: string;

  /** Fecha y hora en la que se cerró la solicitud (si aplica) */
  fechaCierre?: string;
}

/**
 * Payload para el registro de una nueva PQR por parte de un solicitante.
 *
 * @remarks
 * Contiene únicamente los datos requeridos al radicar una solicitud.
 */
export interface CreatePqrPayload {
  /** Tipo de solicitud */
  tipoPqr: PqrType;

  /** Identificador de la categoría */
  idCategoria: number;

  /** Asunto breve */
  asunto: string;

  /** Detalle o motivo de la solicitud */
  descripcion: string;

  /** Nombre completo del solicitante */
  nombreSolicitante: string;

  /** Correo electrónico para notificaciones */
  correoSolicitante: string;

  /** Número de documento o identificación del solicitante */
  identificacionSolicitante: string;
}

