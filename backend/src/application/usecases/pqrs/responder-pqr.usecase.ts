import { CustomError } from '../../../domain/errors/custom.error.js';
import { PqrRepository, PqrResponseRecord } from '../../../domain/repositories/pqr.repository.js';
import { EmailService } from '../../../domain/services/email.service.js';
import { WhatsAppService } from '../../../domain/services/whatsapp.service.js';
import { EmailTemplates } from '../../../infrastructure/services/email-templates.js';
import { WhatsAppTemplates } from '../../../infrastructure/services/whatsapp-templates.js';

export interface ResponderPqrDTO {
  idPqr: number;
  idUsuario: number;
  contenido: string;
}

export class ResponderPqrUseCase {
  constructor(
    private readonly repository: PqrRepository,
    private readonly emailService?: EmailService,
    private readonly whatsappService?: WhatsAppService,
    private readonly appUrl: string = 'http://localhost:4200'
  ) {}

  async execute(dto: ResponderPqrDTO): Promise<PqrResponseRecord> {
    const contenido = dto.contenido?.trim();
    if (!contenido || contenido.length < 10) {
      throw CustomError.badRequest('El contenido de la respuesta debe tener al menos 10 caracteres');
    }

    const pqr = await this.repository.findById(dto.idPqr);
    if (!pqr) {
      throw CustomError.notFound(`PQR con ID ${dto.idPqr} no encontrada`);
    }

    if (pqr.estado === 'Cerrada' || pqr.idEstado === 6) {
      throw CustomError.badRequest('No es posible responder una PQR que ya se encuentra cerrada');
    }

    const respuesta = await this.repository.responder(dto.idPqr, dto.idUsuario, contenido);

    if (this.emailService && pqr.correoSolicitante) {
      try {
        const { subject, html, text } = EmailTemplates.buildRespuestaEmitida({
          nombreSolicitante: pqr.nombreSolicitante || 'Solicitante',
          codigoSeguimiento: pqr.codigoSeguimiento,
          tipoPqr: pqr.tipoPqr,
          fechaRespuesta: respuesta.fechaRespuesta,
          appUrl: this.appUrl,
        });

        await this.emailService.sendEmail({
          to: pqr.correoSolicitante,
          subject,
          html,
          text,
          idPqr: pqr.idPqr,
          tipoEvento: 'RESPUESTA_PQR',
        });
      } catch (err) {
        console.error('[ResponderPqrUseCase] Error en notificación por correo:', err);
      }
    }

    if (this.whatsappService && pqr.telefonoSolicitante) {
      const body = WhatsAppTemplates.buildRespuesta({
        nombreSolicitante: pqr.nombreSolicitante || 'Solicitante',
        codigoSeguimiento: pqr.codigoSeguimiento,
        tipoPqr: pqr.tipoPqr,
        appUrl: this.appUrl,
      });

      void this.whatsappService
        .sendMessage({
          to: pqr.telefonoSolicitante,
          idPqr: pqr.idPqr,
          tipoEvento: 'RESPUESTA_PQR',
          body,
        })
        .catch((err) => {
          console.error('[ResponderPqrUseCase] Error en notificación WhatsApp:', err);
        });
    }

    return respuesta;
  }
}
