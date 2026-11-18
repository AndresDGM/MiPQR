import {
  SendWhatsAppOptions,
  SendWhatsAppResult,
  WhatsAppService,
} from '../../domain/services/whatsapp.service.js';

export interface MetaWhatsAppConfig {
  accessToken?: string;
  phoneNumberId?: string;
  apiVersion?: string;
  templateName?: string;
  templateLang?: string;
}

/**
 * Adaptador oficial de Meta WhatsApp Cloud API (Graph API).
 * Si no se configuran credenciales, opera en modo simulado imprimiendo en consola.
 */
export class MetaWhatsAppService extends WhatsAppService {
  private readonly isConfigured: boolean;
  private readonly apiVersion: string;

  constructor(private readonly config: MetaWhatsAppConfig) {
    super();
    this.apiVersion = config.apiVersion?.trim() || 'v21.0';
    this.isConfigured = Boolean(config.accessToken?.trim() && config.phoneNumberId?.trim());
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
    const to = MetaWhatsAppService.formatPhoneNumber(options.to);

    if (!this.isConfigured) {
      const simulatedSid = `wamid.SIM_${Date.now()}`;
      console.log(
        `[MetaWhatsAppService - SIMULADO] Destino: ${to} | Evento: ${options.tipoEvento || 'NOTIFICACION'} | ID: ${simulatedSid}\n${options.body}`
      );
      return {
        success: true,
        sid: simulatedSid,
        estado: 'SIMULADO',
        simulated: true,
      };
    }

    const endpoint = `https://graph.facebook.com/${this.apiVersion}/${this.config.phoneNumberId}/messages`;
    const templateName = this.config.templateName?.trim();
    const templateLang = this.config.templateLang?.trim() || 'es';

    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
    };

    if (templateName) {
      const templateObj: Record<string, unknown> = {
        name: templateName,
        language: { code: templateLang },
      };
      if (templateName !== 'hello_world') {
        templateObj.components = [
          {
            type: 'body',
            parameters: [{ type: 'text', text: options.body }],
          },
        ];
      }
      payload.type = 'template';
      payload.template = templateObj;
    } else {
      payload.type = 'text';
      payload.text = { preview_url: false, body: options.body };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        messages?: Array<{ id?: string }>;
        error?: { message?: string };
      };

      if (!response.ok) {
        const errorMsg = data.error?.message || `Error HTTP ${response.status} en Meta WhatsApp API`;
        console.error(`[MetaWhatsAppService] Fallo al enviar a ${to}: ${errorMsg}`);
        return { success: false, estado: 'FALLIDO', error: errorMsg };
      }

      const msgId = data.messages?.[0]?.id;
      console.log(
        `[MetaWhatsAppService] Mensaje enviado a ${to} | Evento: ${options.tipoEvento || 'NOTIFICACION'} | ID: ${msgId || 'N/A'}`
      );

      return {
        success: true,
        sid: msgId,
        estado: 'ENVIADO',
        simulated: false,
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error de red comunicando con Meta Graph API';
      console.error(`[MetaWhatsAppService] Error inesperado al enviar a ${to}: ${errorMsg}`);
      return { success: false, estado: 'FALLIDO', error: errorMsg };
    }
  }
}
