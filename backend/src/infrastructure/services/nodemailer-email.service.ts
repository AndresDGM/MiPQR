import nodemailer, { Transporter } from 'nodemailer';
import { EmailService, SendEmailOptions, SendEmailResult } from '../../domain/services/email.service.js';
import { pool } from '../database/postgres.js';

export interface SmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from: string;
  secure?: boolean;
}

/**
 * Adaptador de infraestructura para el envío de correos electrónicos vía Nodemailer con persistencia y auditoría.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export class NodemailerEmailService extends EmailService {
  private transporter: Transporter | null = null;
  private readonly isConfigured: boolean;

  constructor(private readonly config: SmtpConfig) {
    super();
    this.isConfigured = Boolean(config.host && config.user && config.pass);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port || 587,
        secure: config.secure ?? false,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const { to, subject, html, text, idPqr, tipoEvento } = options;
    const cleanTo = to.trim().toLowerCase();

    // 1. Registrar intención en la base de datos (registro_correo)
    let idCorreo: number | null = null;
    try {
      const { rows } = await pool.query<{ id_correo: number }>(
        `INSERT INTO registro_correo (
           id_pqr, destinatario, tipo_evento, asunto, estado, intentos, fecha_creacion
         ) VALUES ($1, $2, $3, $4, 'PENDIENTE', 1, NOW())
         RETURNING id_correo`,
        [idPqr ?? null, cleanTo, tipoEvento, subject]
      );
      idCorreo = rows[0]?.id_correo ?? null;
    } catch (dbErr) {
      console.error('[NodemailerEmailService] Error al registrar intento en BD:', dbErr);
    }

    // 2. Si no hay credenciales SMTP configuradas, simular envío exitoso (modo desarrollo/testing)
    if (!this.isConfigured || !this.transporter) {
      const simulatedMessageId = `<simulated-${Date.now()}@mipqr.local>`;
      console.log(`[EmailService - SIMULADO] Destino: ${cleanTo} | Asunto: "${subject}" | Evento: ${tipoEvento} | ID: ${simulatedMessageId}`);

      if (idCorreo) {
        await pool.query(
          `UPDATE registro_correo
           SET estado = 'ENVIADO', mensaje_id = $1, fecha_envio = NOW()
           WHERE id_correo = $2`,
          [simulatedMessageId, idCorreo]
        ).catch(() => {});
      }

      return {
        success: true,
        estado: 'ENVIADO',
        messageId: simulatedMessageId,
      };
    }

    // 3. Enviar correo real vía Nodemailer
    try {
      const info = await this.transporter.sendMail({
        from: this.config.from,
        to: cleanTo,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      });

      const messageId = info.messageId || `<sent-${Date.now()}@mipqr.com>`;

      if (idCorreo) {
        await pool.query(
          `UPDATE registro_correo
           SET estado = 'ENVIADO', mensaje_id = $1, fecha_envio = NOW()
           WHERE id_correo = $2`,
          [messageId, idCorreo]
        ).catch(() => {});
      }

      return {
        success: true,
        estado: 'ENVIADO',
        messageId,
      };
    } catch (sendErr: any) {
      const errorMessage = sendErr?.message || 'Error desconocido al enviar correo vía SMTP';
      console.error(`[NodemailerEmailService] Fallo en envío a ${cleanTo}:`, errorMessage);

      if (idCorreo) {
        await pool.query(
          `UPDATE registro_correo
           SET estado = 'FALLIDO', mensaje_error = $1
           WHERE id_correo = $2`,
          [errorMessage, idCorreo]
        ).catch(() => {});
      }

      return {
        success: false,
        estado: 'FALLIDO',
        error: errorMessage,
      };
    }
  }
}
