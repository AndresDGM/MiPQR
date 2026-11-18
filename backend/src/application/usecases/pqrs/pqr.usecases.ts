import { CreatePqrData, PqrRecord, PqrRepository } from '../../../domain/repositories/pqr.repository.js';
import { PQRClassificationRepository } from '../../../domain/repositories/pqr-classification.repository.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { EmailService } from '../../../domain/services/email.service.js';
import { EmailTemplates } from '../../../infrastructure/services/email-templates.js';
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
  private readonly appUrl: string;

  constructor(
    repository: PqrRepository,
    arg2?: PQRClassificationRepository | EmailService,
    arg3?: EmailService | string,
    arg4?: string
  ) {
    this.repository = repository;
    if (arg2 && 'classify' in arg2) {
      this.classificationRepo = arg2 as PQRClassificationRepository;
      if (arg3 && typeof arg3 === 'object' && 'sendEmail' in arg3) {
        this.emailService = arg3 as EmailService;
        this.appUrl = arg4 || 'http://localhost:4200';
      } else if (typeof arg3 === 'string') {
        this.appUrl = arg3;
      } else {
        this.appUrl = 'http://localhost:4200';
      }
    } else if (arg2 && 'sendEmail' in arg2) {
      this.emailService = arg2 as EmailService;
      this.appUrl = typeof arg3 === 'string' ? arg3 : 'http://localhost:4200';
    } else {
      this.appUrl = typeof arg4 === 'string' ? arg4 : typeof arg3 === 'string' ? arg3 : 'http://localhost:4200';
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

    // 3. Notificación por correo electrónico al solicitante (no bloqueante)
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
