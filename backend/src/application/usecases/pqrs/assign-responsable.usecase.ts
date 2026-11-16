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

    // 2. Validar que la PQR no se encuentre en un estado terminal
    const estadosTerminales = ['Cerrada'];
    if (estadosTerminales.includes(pqr.estado) || pqr.idEstado === 6) {
      throw CustomError.badRequest(
        `No es posible asignar responsables a una PQR que ya se encuentra en estado terminal ("${pqr.estado}")`
      );
    }

    // 3. Validar existencia del usuario responsable
    const responsable = await this.usuarioRepository.getById(idResponsable);
    if (!responsable) {
      throw CustomError.notFound(`Usuario responsable con ID ${idResponsable} no encontrado`);
    }

    // 4. Validar que el responsable esté activo
    if (!responsable.activo) {
      throw CustomError.badRequest(
        `El usuario "${responsable.nombre}" se encuentra inactivo y no puede recibir asignaciones`
      );
    }

    // 5. Validar que el responsable tenga el rol correspondiente (idRol 3 = Responsable)
    if (responsable.idRol !== 3) {
      throw CustomError.badRequest(
        `El usuario "${responsable.nombre}" no cuenta con el rol de Responsable (idRol actual: ${responsable.idRol})`
      );
    }

    // 6. Persistir la asignación en la base de datos
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
          mensaje:
            sendResult.error ||
            (sendResult.simulated
              ? `Notificación simulada para ${responsable.correo} (SMTP no configurado)`
              : `Notificación enviada a ${responsable.correo}`),
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
