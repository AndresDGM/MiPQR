import { CreatePqrData, PqrRecord, PqrRepository } from '../../../domain/repositories/pqr.repository.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { EmailService } from '../../../domain/services/email.service.js';
import { EmailTemplates } from '../../../infrastructure/services/email-templates.js';

export class GetAllPqrsBackendUseCase {
  constructor(private readonly repository: PqrRepository) {}
  execute(limit?: number): Promise<PqrRecord[]> {
    return this.repository.getAll(limit);
  }
}

export class GetPqrByIdBackendUseCase {
  constructor(private readonly repository: PqrRepository) {}
  async execute(idPqr: number): Promise<PqrRecord> {
    const pqr = await this.repository.findById(idPqr);
    if (!pqr) throw CustomError.notFound(`PQR con ID ${idPqr} no encontrada`);
    return pqr;
  }
}

export class GetPqrByCodigoBackendUseCase {
  constructor(private readonly repository: PqrRepository) {}
  async execute(codigo: string): Promise<PqrRecord> {
    const pqr = await this.repository.findByCodigo(codigo);
    if (!pqr) throw CustomError.notFound(`No se encontró ninguna PQR con el código "${codigo}"`);
    return pqr;
  }
}

export class CreatePqrBackendUseCase {
  constructor(
    private readonly repository: PqrRepository,
    private readonly emailService?: EmailService,
    private readonly appUrl: string = 'http://localhost:4200'
  ) {}

  async execute(data: CreatePqrData): Promise<PqrRecord> {
    const pqr = await this.repository.create(data);

    // Si cuenta con servicio de correo y destinatario, notificar al solicitante
    if (this.emailService && pqr.correoSolicitante) {
      try {
        const { subject, html, text } = EmailTemplates.buildSolicitanteRegistro({
          nombreSolicitante: pqr.nombreSolicitante || 'Solicitante',
          codigoSeguimiento: pqr.codigoSeguimiento,
          tipoPqr: pqr.tipoPqr,
          asunto: pqr.asunto,
          descripcion: pqr.descripcion,
          fechaRegistro: pqr.fechaRegistro,
          estadoInicial: pqr.estado,
          appUrl: this.appUrl,
        });

        const sendResult = await this.emailService.sendEmail({
          to: pqr.correoSolicitante,
          subject,
          html,
          text,
          idPqr: pqr.idPqr,
          tipoEvento: 'REGISTRO_PQR',
        });

        pqr.notificacionEmail = {
          enviado: sendResult.success,
          estado: sendResult.estado,
          mensaje:
            sendResult.error ||
            (sendResult.simulated
              ? 'Notificación simulada correctamente (SMTP no configurado)'
              : 'Correo de confirmación enviado exitosamente'),
        };
      } catch (err: any) {
        console.error('[CreatePqrBackendUseCase] Error inesperado en notificación por correo:', err);
        pqr.notificacionEmail = {
          enviado: false,
          estado: 'FALLIDO',
          mensaje: err?.message || 'Error al procesar correo de confirmación',
        };
      }
    }

    return pqr;
  }
}
