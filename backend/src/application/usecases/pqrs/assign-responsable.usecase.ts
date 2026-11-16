import { CustomError } from '../../../domain/errors/custom.error.js';
import { PqrRecord, PqrRepository } from '../../../domain/repositories/pqr.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { EmailService } from '../../../domain/services/email.service.js';
import { EmailTemplates } from '../../../infrastructure/services/email-templates.js';

/**
 * Caso de uso para asignar un profesional responsable a una PQR y notificarle vía correo electrónico.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
export class AssignPqrResponsableBackendUseCase {
  constructor(
    private readonly pqrRepository: PqrRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly emailService?: EmailService,
    private readonly appUrl: string = 'http://localhost:4200'
  ) {}

  async execute(idPqr: number, idResponsable: number): Promise<PqrRecord> {
    // 1. Validar existencia de la PQR
    const pqr = await this.pqrRepository.findById(idPqr);
    if (!pqr) {
      throw CustomError.notFound(`PQR con ID ${idPqr} no encontrada`);
    }

    // 2. Validar existencia del usuario responsable
    const responsable = await this.usuarioRepository.getById(idResponsable);
    if (!responsable) {
      throw CustomError.notFound(`Usuario responsable con ID ${idResponsable} no encontrado`);
    }

    // 3. Persistir la asignación en la base de datos
    const updated = await this.pqrRepository.assignResponsable(idPqr, idResponsable);

    // 4. Enviar notificación por correo al responsable asignado
    if (this.emailService && responsable.correo) {
      try {
        const { subject, html, text } = EmailTemplates.buildResponsableAsignado({
          nombreResponsable: responsable.nombre,
          codigoSeguimiento: updated.codigoSeguimiento,
          tipoPqr: updated.tipoPqr,
          asunto: updated.asunto,
          descripcion: updated.descripcion,
          nombreSolicitante: updated.nombreSolicitante,
          fechaRegistro: updated.fechaRegistro,
          fechaAsignacion: new Date(),
          estadoActual: updated.estado,
          idPqr: updated.idPqr,
          appUrl: this.appUrl,
        });

        const sendResult = await this.emailService.sendEmail({
          to: responsable.correo,
          subject,
          html,
          text,
          idPqr: updated.idPqr,
          tipoEvento: 'ASIGNACION_RESPONSABLE',
        });

        updated.notificacionEmail = {
          enviado: sendResult.success,
          estado: sendResult.estado,
          mensaje: sendResult.error || (sendResult.success ? `Notificación enviada a ${responsable.correo}` : undefined),
        };
      } catch (err: any) {
        console.error('[AssignPqrResponsableBackendUseCase] Error inesperado en notificación por correo:', err);
        updated.notificacionEmail = {
          enviado: false,
          estado: 'FALLIDO',
          mensaje: err?.message || 'Error al procesar correo de asignación',
        };
      }
    }

    return updated;
  }
}
