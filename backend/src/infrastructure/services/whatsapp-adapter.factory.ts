import { WhatsAppService } from '../../domain/services/whatsapp.service.js';
import {
  EvolutionWhatsAppConfig,
  EvolutionWhatsAppService,
} from './evolution-whatsapp.service.js';
import { MetaWhatsAppConfig, MetaWhatsAppService } from './meta-whatsapp.service.js';
import { TwilioConfig, TwilioWhatsAppService } from './twilio-whatsapp.service.js';

export type WhatsAppProvider = 'evolution' | 'twilio' | 'meta' | 'simulated';

export interface WhatsAppAdapterConfig {
  evolution?: EvolutionWhatsAppConfig;
  twilio?: TwilioConfig;
  meta?: MetaWhatsAppConfig;
}

/**
 * Selector único de adaptador de WhatsApp (Patrón Adapter + Factory).
 * Permite cambiar de proveedor con una sola línea / llamada.
 */
export function createWhatsAppAdapter(
  provider: WhatsAppProvider = 'evolution',
  config: WhatsAppAdapterConfig = {}
): WhatsAppService {
  const adapters: Record<WhatsAppProvider, () => WhatsAppService> = {
    evolution: () => new EvolutionWhatsAppService(config.evolution ?? {}),
    twilio: () => new TwilioWhatsAppService(config.twilio ?? { from: 'whatsapp:+14155238886' }),
    meta: () => new MetaWhatsAppService(config.meta ?? {}),
    simulated: () => new EvolutionWhatsAppService({}),
  };

  return (adapters[provider] ?? adapters.evolution)();
}
