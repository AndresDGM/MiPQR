export interface SendWhatsAppOptions {
  to: string;
  body: string;
  idPqr?: number;
  tipoEvento?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  sid?: string;
  estado: 'ENVIADO' | 'FALLIDO' | 'SIMULADO';
  simulated?: boolean;
  error?: string;
}

export abstract class WhatsAppService {
  abstract sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult>;
}
