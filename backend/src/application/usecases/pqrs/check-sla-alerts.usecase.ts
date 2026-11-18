import { PqrRepository } from '../../../domain/repositories/pqr.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { EmailService } from '../../../domain/services/email.service.js';
import { WhatsAppService } from '../../../domain/services/whatsapp.service.js';
import { EmailTemplates } from '../../../infrastructure/services/email-templates.js';
import { WhatsAppTemplates } from '../../../infrastructure/services/whatsapp-templates.js';

export interface SlaAlertSummary {
  revisadas: number;
  alertadas: number;
}

export class CheckSlaAlertsUseCase {
  constructor(
    private readonly pqrRepository: PqrRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly emailService?: EmailService,
    private readonly whatsappService?: WhatsAppService,
    private readonly appUrl: string = 'http://localhost:4200',
    private readonly horasAntes: number = 48
  ) {}

  async execute(): Promise<SlaAlertSummary> {
    const pendientes = await this.pqrRepository.findProximasAVencer(this.horasAntes);
    if (pendientes.length === 0) {
      return { revisadas: 0, alertadas: 0 };
    }

    const todosUsuarios = await this.usuarioRepository.getAll();
    const analistasSiau = todosUsuarios.filter((u) => u.activo && u.idRol === 2);

    let alertadas = 0;

    for (const pqr of pendientes) {
      const destinatarios = pqr.idResponsable
        ? todosUsuarios.filter((u) => u.activo && u.idUsuario === pqr.idResponsable)
        : analistasSiau;

      const fechaLimite = pqr.fechaLimite ? new Date(pqr.fechaLimite) : new Date();
      const horasRestantes = (fechaLimite.getTime() - Date.now()) / (1000 * 60 * 60);

      for (const dest of destinatarios) {
        if (this.emailService && dest.correo) {
          try {
            const { subject, html, text } = EmailTemplates.buildAlertaVencimiento({
              nombreDestinatario: dest.nombre,
              codigoSeguimiento: pqr.codigoSeguimiento,
              tipoPqr: pqr.tipoPqr,
              estadoActual: pqr.estado,
              fechaLimite,
              horasRestantes,
              idPqr: pqr.idPqr,
              appUrl: this.appUrl,
            });

            await this.emailService.sendEmail({
              to: dest.correo,
              subject,
              html,
              text,
              idPqr: pqr.idPqr,
              tipoEvento: 'ALERTA_VENCIMIENTO',
            });
          } catch (err) {
            console.error('[CheckSlaAlertsUseCase] Error enviando correo SLA:', err);
          }
        }

        if (this.whatsappService && dest.telefono) {
          try {
            const body = WhatsAppTemplates.buildAlertaVencimiento({
              nombreDestinatario: dest.nombre,
              codigoSeguimiento: pqr.codigoSeguimiento,
              tipoPqr: pqr.tipoPqr,
              estadoActual: pqr.estado,
              horasRestantes,
              fechaLimite,
              idPqr: pqr.idPqr,
              appUrl: this.appUrl,
            });
            await this.whatsappService.sendMessage({
              to: dest.telefono,
              idPqr: pqr.idPqr,
              tipoEvento: 'ALERTA_VENCIMIENTO',
              body,
            });
          } catch (err) {
            console.error('[CheckSlaAlertsUseCase] Error enviando WhatsApp SLA:', err);
          }
        }
      }

      await this.pqrRepository.markAlertaVencimientoEnviada(pqr.idPqr);
      alertadas++;
    }

    return { revisadas: pendientes.length, alertadas };
  }
}
