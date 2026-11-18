import {
  SendWhatsAppOptions,
  SendWhatsAppResult,
  WhatsAppService,
} from '../../domain/services/whatsapp.service.js';

export interface EvolutionWhatsAppConfig {
  baseUrl?: string;
  apiKey?: string;
  instance?: string;
}

/**
 * Adaptador de WhatsApp mediante Evolution API (self-hosted).
 * Si no se configuran credenciales, opera en modo simulado imprimiendo en consola.
 */
export class EvolutionWhatsAppService extends WhatsAppService {
  private readonly isConfigured: boolean;
  private readonly baseUrl: string;

  constructor(private readonly config: EvolutionWhatsAppConfig) {
    super();
    this.baseUrl = (config.baseUrl || '').trim().replace(/\/+$/, '');
    this.isConfigured = Boolean(
      this.baseUrl && config.apiKey?.trim() && config.instance?.trim()
    );
  }

  /** Normaliza un número telefónico al formato internacional sin `+` (ej. `573001234567`). */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.trim().replace(/^whatsapp:/i, '').replace(/[\s+()-]/g, '');
    if (/^3\d{9}$/.test(cleaned)) {
      return `57${cleaned}`;
    }
    return cleaned;
  }

  async sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    const number = EvolutionWhatsAppService.formatPhoneNumber(options.to);

    if (!this.isConfigured) {
      const simulatedSid = `evo.SIM_${Date.now()}`;
      console.log(
        `[EvolutionWhatsAppService - SIMULADO] Destino: ${number} | Evento: ${options.tipoEvento || 'NOTIFICACION'} | ID: ${simulatedSid}\n${options.body}`
      );
      return {
        success: true,
        sid: simulatedSid,
        estado: 'SIMULADO',
        simulated: true,
      };
    }

    const endpoint = `${this.baseUrl}/message/sendText/${encodeURIComponent(this.config.instance!.trim())}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: this.config.apiKey!.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number,
          text: options.body,
        }),
      });

      const data = (await response.json()) as {
        key?: { id?: string };
        message?: string | string[];
      };

      if (!response.ok) {
        const errorMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || `Error HTTP ${response.status} en Evolution API`;
        console.error(`[EvolutionWhatsAppService] Fallo al enviar a ${number}: ${errorMsg}`);
        return { success: false, estado: 'FALLIDO', error: errorMsg };
      }

      const msgId = data.key?.id;
      console.log(
        `[EvolutionWhatsAppService] Mensaje enviado a ${number} | Evento: ${options.tipoEvento || 'NOTIFICACION'} | ID: ${msgId || 'N/A'}`
      );

      return {
        success: true,
        sid: msgId,
        estado: 'ENVIADO',
        simulated: false,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error de red comunicando con Evolution API';
      console.error(`[EvolutionWhatsAppService] Error inesperado al enviar a ${number}: ${errorMsg}`);
      return { success: false, estado: 'FALLIDO', error: errorMsg };
    }
  }
}
