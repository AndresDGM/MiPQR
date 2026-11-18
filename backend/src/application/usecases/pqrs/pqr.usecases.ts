import { CreatePqrData, PqrRecord, PqrRepository } from '../../../domain/repositories/pqr.repository.js';
import { PQRClassificationRepository } from '../../../domain/repositories/pqr-classification.repository.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { EmailService } from '../../../domain/services/email.service.js';
import { WhatsAppService } from '../../../domain/services/whatsapp.service.js';
import { EmailTemplates } from '../../../infrastructure/services/email-templates.js';
import { WhatsAppTemplates } from '../../../infrastructure/services/whatsapp-templates.js';
import { Actor } from '../../types/actor.type.js';

export class GetAllPqrsBackendUseCase {
  constructor(private readonly repository: PqrRepository) {}

  async execute(limit?: number, actor?: Actor): Promise<PqrRecord[]> {
    const pqrs = await this.repository.getAll(limit);
    if (!actor || actor.rol === 'Analista SIAU' || actor.rol === 'Directivo') {
      return pqrs;
    }
    if (actor.rol === 'Responsable') {
      return pqrs.filter((p) => p.idResponsable === actor.idUsuario);
    }
    return pqrs.filter((p) => p.idSolicitante === actor.idUsuario);
  }
}

export class GetPqrByIdBackendUseCase {
  constructor(private readonly repository: PqrRepository) {}

  async execute(idPqr: number, actor?: Actor): Promise<PqrRecord> {
    const pqr = await this.repository.findById(idPqr);
    if (!pqr) throw CustomError.notFound(`PQR con ID ${idPqr} no encontrada`);

    if (actor?.rol === 'Solicitante' && pqr.idSolicitante !== actor.idUsuario) {
      throw CustomError.forbidden('No tiene permisos para consultar esta PQR');
    }
    if (actor?.rol === 'Responsable' && pqr.idResponsable !== actor.idUsuario) {
      throw CustomError.forbidden('No tiene permisos para consultar esta PQR');
    }

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
  private readonly repository: PqrRepository;
  private readonly classificationRepo?: PQRClassificationRepository;
  private readonly emailService?: EmailService;
  private readonly whatsappService?: WhatsAppService;
  private readonly appUrl: string;

  constructor(
    repository: PqrRepository,
    arg2?: PQRClassificationRepository | EmailService,
    arg3?: EmailService | string,
    arg4?: string,
    arg5?: WhatsAppService
  ) {
    this.repository = repository;
    this.whatsappService = arg5;
    if (arg2 && 'sendEmail' in arg2) {
      this.emailService = arg2 as EmailService;
      this.appUrl = typeof arg3 === 'string' ? arg3 : 'http://localhost:4200';
    } else {
      if (arg2 && 'classify' in arg2) {
        this.classificationRepo = arg2 as PQRClassificationRepository;
      }
      if (arg3 && typeof arg3 === 'object' && 'sendEmail' in arg3) {
        this.emailService = arg3 as EmailService;
      }
      this.appUrl =
        typeof arg4 === 'string'
          ? arg4
          : typeof arg3 === 'string'
            ? arg3
            : 'http://localhost:4200';
    }
  }

  async execute(data: CreatePqrData): Promise<PqrRecord> {
    // 1. Clasificación automática asistida por IA (no bloqueante)
    if (!data.categoriaSugeridaIa && this.classificationRepo) {
      try {
        const text = `${data.asunto} ${data.descripcion}`.trim();
        const suggestion = await this.classificationRepo.classify(text);
        if (suggestion) {
          data.categoriaSugeridaIa = suggestion.categoriaPredicha;
          data.confianzaIa = suggestion.confianza;
          data.versionModeloIa = suggestion.versionModelo;
        }
      } catch {
        // En caso de fallo o timeout de la IA, la radicación de la PQR continúa sin bloqueo
      }
    }

    // 2. Persistir la PQR en la base de datos
    const pqr = await this.repository.create(data);

    // 3. Despachar correo y WhatsApp en segundo plano para no bloquear la respuesta HTTP
    if (this.emailService && pqr.correoSolicitante) {
      pqr.notificacionEmail = {
        enviado: false,
        estado: 'PENDIENTE',
        mensaje: 'El correo de confirmación se encuentra en proceso de despacho.',
      };
    }

    this.dispatchRegistrationNotifications(pqr);

    return pqr;
  }

  private dispatchRegistrationNotifications(pqr: PqrRecord): void {
    const tasks: Promise<unknown>[] = [];

    if (this.emailService && pqr.correoSolicitante) {
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

      tasks.push(
        this.emailService
          .sendEmail({
            to: pqr.correoSolicitante,
            subject,
            html,
            text,
            idPqr: pqr.idPqr,
            tipoEvento: 'REGISTRO_PQR',
          })
          .catch((err) => {
            console.error('[CreatePqrBackendUseCase] Error en notificación por correo:', err);
          })
      );
    }

    if (this.whatsappService && pqr.telefonoSolicitante) {
      const body = WhatsAppTemplates.buildRegistro({
        nombreSolicitante: pqr.nombreSolicitante || 'Solicitante',
        codigoSeguimiento: pqr.codigoSeguimiento,
        tipoPqr: pqr.tipoPqr,
        categoria: pqr.categoria,
        fechaLimite: pqr.fechaLimite,
        appUrl: this.appUrl,
      });

      tasks.push(
        this.whatsappService
          .sendMessage({
            to: pqr.telefonoSolicitante,
            idPqr: pqr.idPqr,
            tipoEvento: 'REGISTRO_PQR',
            body,
          })
          .catch((err) => {
            console.error('[CreatePqrBackendUseCase] Error en notificación WhatsApp:', err);
          })
      );
    }

    if (tasks.length > 0) {
      void Promise.allSettled(tasks);
    }
  }
}

export interface UpdateCategoriaDTO {
  idPqr: number;
  idCategoria: number;
  categoria: string;
  estadoRevisionIa: 'CONFIRMADA' | 'MODIFICADA';
  idUsuarioRevision?: number | null;
}

export class UpdatePqrCategoriaUseCase {
  constructor(private readonly repository: PqrRepository) {}

  async execute(dto: UpdateCategoriaDTO): Promise<PqrRecord> {
    const pqr = await this.repository.findById(dto.idPqr);
    if (!pqr) {
      throw CustomError.notFound(`PQR con ID ${dto.idPqr} no encontrada`);
    }

    if (!dto.idCategoria || !dto.categoria) {
      throw CustomError.badRequest('Se debe especificar la categoría y su identificador');
    }

    if (!['CONFIRMADA', 'MODIFICADA'].includes(dto.estadoRevisionIa)) {
      throw CustomError.badRequest('El estado de revisión debe ser CONFIRMADA o MODIFICADA');
    }

    return this.repository.updateCategoria(
      dto.idPqr,
      dto.idCategoria,
      dto.categoria,
      dto.estadoRevisionIa,
      dto.idUsuarioRevision
    );
  }
}
