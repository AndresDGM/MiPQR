import { SendWhatsAppOptions, SendWhatsAppResult, WhatsAppService } from '../../domain/services/whatsapp.service.js';

export interface TwilioConfig {
  accountSid?: string;
  authToken?: string;
  from: string;
  contentSid?: string;
}

/**
 * Adaptador de WhatsApp mediante la API REST de Twilio (Sandbox o Producción).
 * Si no se configuran credenciales, opera en modo simulado imprimiendo en consola.
 */
export class TwilioWhatsAppService extends WhatsAppService {
  private readonly isConfigured: boolean;

  constructor(private readonly config: TwilioConfig) {
    super();
    this.isConfigured = Boolean(
      config.accountSid?.trim() && config.authToken?.trim() && config.from?.trim()
    );
  }

  /** Normaliza un número telefónico al formato `whatsapp:+E164`. */
  static formatWhatsAppNumber(phone: string): string {
    const cleaned = phone.trim().replace(/^whatsapp:/i, '').replace(/[\s()-]/g, '');
    if (cleaned.startsWith('+')) {
      return `whatsapp:${cleaned}`;
    }
    // Números móviles de Colombia (10 dígitos iniciando en 3)
    if (/^3\d{9}$/.test(cleaned)) {
      return `whatsapp:+57${cleaned}`;
    }
    return `whatsapp:+${cleaned}`;
  }

  async sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    const to = TwilioWhatsAppService.formatWhatsAppNumber(options.to);
    const from = this.config.from;

    if (!this.isConfigured) {
      const simulatedSid = `SM_SIM_${Date.now()}`;
      console.log(
        `[WhatsAppService - SIMULADO] Destino: ${to} | Evento: ${options.tipoEvento || 'NOTIFICACION'} | SID: ${simulatedSid}\n${options.body}`
      );
      return {
        success: true,
        sid: simulatedSid,
        estado: 'SIMULADO',
        simulated: true,
      };
    }

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
    const bodyParams = new URLSearchParams({
      From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      To: to,
    });

    if (this.config.contentSid?.trim()) {
      bodyParams.set('ContentSid', this.config.contentSid.trim());
      bodyParams.set(
        'ContentVariables',
        JSON.stringify({
          '1': options.tipoEvento || 'MiPQR',
          '2': options.body,
        })
      );
    } else {
      bodyParams.set('Body', options.body);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = (await response.json()) as { sid?: string; message?: string };
      if (!response.ok) {
        const errorMsg = data.message || `Error HTTP ${response.status} al enviar WhatsApp`;
        console.error(`[TwilioWhatsAppService] Fallo al enviar a ${to}: ${errorMsg}`);
        return { success: false, estado: 'FALLIDO', error: errorMsg };
      }

      console.log(
        `[TwilioWhatsAppService] Mensaje enviado a ${to} | Evento: ${options.tipoEvento || 'NOTIFICACION'} | SID: ${data.sid || 'N/A'}`
      );

      return {
        success: true,
        sid: data.sid,
        estado: 'ENVIADO',
        simulated: false,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error de red comunicando con Twilio';
      console.error(`[TwilioWhatsAppService] Error inesperado al enviar a ${to}: ${errorMsg}`);
      return { success: false, estado: 'FALLIDO', error: errorMsg };
    }
  }
}
