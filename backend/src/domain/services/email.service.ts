export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idPqr?: number;
  tipoEvento: 'REGISTRO_PQR' | 'ASIGNACION_RESPONSABLE' | 'ALERTA_VENCIMIENTO';
}

export interface SendEmailResult {
  success: boolean;
  estado: 'ENVIADO' | 'PENDIENTE' | 'FALLIDO' | 'SIMULADO';
  simulated?: boolean;
  messageId?: string;
  error?: string;
  auditError?: string;
}

/**
 * Contrato de servicio para el envío y registro de notificaciones por correo electrónico.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class EmailService {
  /**
   * Envía un correo electrónico y registra la auditoría del despacho.
   * No debe propagar excepciones fatales para evitar interrumpir las transacciones principales.
   */
  abstract sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
}
