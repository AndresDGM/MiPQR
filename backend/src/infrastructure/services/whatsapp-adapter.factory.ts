import { WhatsAppService } from '../../domain/services/whatsapp.service.js';
import {
  EvolutionWhatsAppConfig,
  EvolutionWhatsAppService,
} from './evolution-whatsapp.service.js';
import { TwilioConfig, TwilioWhatsAppService } from './twilio-whatsapp.service.js';

export type WhatsAppProvider = 'evolution' | 'twilio' | 'simulated';

export interface WhatsAppAdapterConfig {
  evolution?: EvolutionWhatsAppConfig;
  twilio?: TwilioConfig;
}

/**
 * Selector único de adaptador de WhatsApp (Patrón Adapter + Factory).
 * Permite cambiar de proveedor con una sola línea / llamada.
 */
export function createWhatsAppAdapter(
  provider: WhatsAppProvider,
  config: WhatsAppAdapterConfig = {}
): WhatsAppService {
  const adapters: Record<WhatsAppProvider, () => WhatsAppService> = {
    evolution: () => new EvolutionWhatsAppService(config.evolution ?? {}),
    twilio: () => new TwilioWhatsAppService(config.twilio ?? { from: 'whatsapp:+14155238886' }),
    simulated: () => new EvolutionWhatsAppService({}),
  };

  return (adapters[provider] ?? adapters.evolution)();
}
