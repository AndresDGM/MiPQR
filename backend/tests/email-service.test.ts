import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NodemailerEmailService } from '../src/infrastructure/services/nodemailer-email.service.js';
import { CreatePqrBackendUseCase } from '../src/application/usecases/pqrs/pqr.usecases.js';
import { AssignPqrResponsableBackendUseCase } from '../src/application/usecases/pqrs/assign-responsable.usecase.js';
import { CreatePqrData, PqrRecord, PqrRepository } from '../src/domain/repositories/pqr.repository.js';
import { UsuarioRepository } from '../src/domain/repositories/usuario.repository.js';
import { EmailService, SendEmailOptions, SendEmailResult } from '../src/domain/services/email.service.js';
import { CustomError } from '../src/domain/errors/custom.error.js';

class MockPqrRepository extends PqrRepository {
  private pqrs: PqrRecord[] = [
    {
      idPqr: 10,
      codigoSeguimiento: 'PQR-2026-0010',
      idCategoria: 1,
      categoria: 'General',
      idEstado: 1,
      estado: 'Recibida',
      tipoPqr: 'Peticion',
      asunto: 'Asunto de prueba',
      descripcion: 'Detalle de prueba',
      nombreSolicitante: 'Solicitante Uno',
      correoSolicitante: 'solicitante@test.com',
      fechaRegistro: new Date(),
    },
    {
      idPqr: 30,
      codigoSeguimiento: 'PQR-2026-0030',
      idCategoria: 1,
      categoria: 'General',
      idEstado: 6,
      estado: 'Cerrada',
      tipoPqr: 'Reclamo',
      asunto: 'Caso cerrado terminado',
      descripcion: 'Trámite finalizado con respuesta oficial',
      nombreSolicitante: 'Paciente Cerrado',
      correoSolicitante: 'cerrado@test.com',
      fechaRegistro: new Date(),
    },
  ];

  async getAll(): Promise<PqrRecord[]> {
    return this.pqrs;
  }

  async findById(idPqr: number): Promise<PqrRecord | null> {
    return this.pqrs.find((p) => p.idPqr === idPqr) || null;
  }

  async findByCodigo(codigo: string): Promise<PqrRecord | null> {
    return this.pqrs.find((p) => p.codigoSeguimiento === codigo) || null;
  }

  async create(data: CreatePqrData): Promise<PqrRecord> {
    const created: PqrRecord = {
      idPqr: this.pqrs.length + 1,
      codigoSeguimiento: `PQR-2026-000${this.pqrs.length + 1}`,
      idCategoria: data.idCategoria,
      categoria: 'General',
      idEstado: 1,
      estado: 'Recibida',
      tipoPqr: data.tipoPqr,
      asunto: data.asunto,
      descripcion: data.descripcion,
      nombreSolicitante: data.nombreSolicitante,
      correoSolicitante: data.correoSolicitante,
      identificacionSolicitante: data.identificacionSolicitante,
      fechaRegistro: new Date(),
    };
    this.pqrs.push(created);
    return created;
  }

  async assignResponsable(idPqr: number, idResponsable: number): Promise<PqrRecord> {
    const p = await this.findById(idPqr);
    if (!p) throw new Error('Not found');
    p.idResponsable = idResponsable;
    p.nombreResponsable = 'Dr. Responsable';
    p.idEstado = 3;
    p.estado = 'Asignada';
    return { ...p };
  }
}

class MockUsuarioRepository extends UsuarioRepository {
  async getAll(): Promise<any[]> { return []; }
  async getById(idUsuario: number): Promise<any | null> {
    if (idUsuario === 20) {
      return {
        idUsuario: 20,
        nombre: 'Dr. Fernando Responsable',
        correo: 'fernando.resp@dolormed.com',
        idRol: 3, // Responsable
        identificacion: '202020',
        activo: true,
      };
    }
    if (idUsuario === 21) {
      // Inactivo
      return {
        idUsuario: 21,
        nombre: 'Dr. Usuario Inactivo',
        correo: 'inactivo@dolormed.com',
        idRol: 3,
        identificacion: '212121',
        activo: false,
      };
    }
    if (idUsuario === 22) {
      // Rol incorrecto (Solicitante idRol: 1)
      return {
        idUsuario: 22,
        nombre: 'Juan Solicitante',
        correo: 'juan.solic@dolormed.com',
        idRol: 1,
        identificacion: '222222',
        activo: true,
      };
    }
    return null;
  }
  async getByCorreo(): Promise<any | null> { return null; }
  async getByIdentificacion(): Promise<any | null> { return null; }
  async getByRol(): Promise<any[]> { return []; }
  async create(): Promise<any> { throw new Error('Not implemented'); }
  async update(): Promise<any | null> { return null; }
  async setActivo(): Promise<any | null> { return null; }
}

describe('NodemailerEmailService & Casos de Uso con Notificación', () => {
  it('debe diferenciar explícitamente el envío simulado cuando no hay SMTP configurado', async () => {
    const emailService = new NodemailerEmailService({
      from: 'MiPQR <notificaciones@mipqr.com>',
    });

    const result = await emailService.sendEmail({
      to: 'paciente@test.com',
      subject: 'Prueba de radicación',
      html: '<p>Contenido</p>',
      tipoEvento: 'REGISTRO_PQR',
    });

    assert.equal(result.success, true);
    assert.equal(result.estado, 'SIMULADO');
    assert.equal(result.simulated, true);
    assert.ok(result.messageId?.includes('simulated'));
  });

  it('debe retornar estado FALLIDO ante configuración SMTP incorrecta o fallo de conexión', async () => {
    // Configuración SMTP apuntando a un host y puerto inexistente con credenciales inválidas
    const failingSmtpService = new NodemailerEmailService({
      host: '127.0.0.1',
      port: 59998,
      user: 'usuario_invalido@test.com',
      pass: 'clave_invalida',
      from: 'MiPQR <notificaciones@mipqr.com>',
    });

    const result = await failingSmtpService.sendEmail({
      to: 'destinatario@test.com',
      subject: 'Fallo intencional SMTP',
      html: '<p>Prueba de error</p>',
      tipoEvento: 'REGISTRO_PQR',
    });

    assert.equal(result.success, false);
    assert.equal(result.estado, 'FALLIDO');
    assert.equal(result.simulated, false);
    assert.ok(result.error && result.error.length > 0);
  });

  it('CreatePqrBackendUseCase debe crear la PQR y notificar al solicitante por correo', async () => {
    const repo = new MockPqrRepository();
    let sentOptions: SendEmailOptions | null = null;

    const mockEmailService: EmailService = {
      async sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
        sentOptions = opts;
        return { success: true, estado: 'ENVIADO', messageId: '<msg-123>' };
      },
    };

    const useCase = new CreatePqrBackendUseCase(repo, mockEmailService, 'http://localhost:4200');
    const result = await useCase.execute({
      tipoPqr: 'Peticion',
      idCategoria: 1,
      asunto: 'Solicitud médica',
      descripcion: 'Detalle de prueba para envío de correo',
      nombreSolicitante: 'Ana María',
      correoSolicitante: 'ana.maria@test.com',
      identificacionSolicitante: '10203040',
    });

    assert.ok(result.idPqr);
    assert.equal(result.notificacionEmail?.enviado, true);
    assert.equal(result.notificacionEmail?.estado, 'ENVIADO');
    assert.ok(sentOptions);
    assert.equal((sentOptions as SendEmailOptions).to, 'ana.maria@test.com');
    assert.equal((sentOptions as SendEmailOptions).tipoEvento, 'REGISTRO_PQR');
  });

  it('CreatePqrBackendUseCase debe preservar la creación de la PQR aunque falle el servicio de correo', async () => {
    const repo = new MockPqrRepository();

    const failingEmailService: EmailService = {
      async sendEmail(): Promise<SendEmailResult> {
        return { success: false, estado: 'FALLIDO', error: 'SMTP connection timeout' };
      },
    };

    const useCase = new CreatePqrBackendUseCase(repo, failingEmailService, 'http://localhost:4200');
    const result = await useCase.execute({
      tipoPqr: 'Reclamo',
      idCategoria: 2,
      asunto: 'Cobro de cita',
      descripcion: 'Cobro no autorizado',
      nombreSolicitante: 'Pedro Gómez',
      correoSolicitante: 'pedro@test.com',
      identificacionSolicitante: '99887766',
    });

    // La PQR se crea con éxito
    assert.ok(result.idPqr);
    assert.equal(result.asunto, 'Cobro de cita');
    // Se registra el fallo del correo sin arrojar error fatal
    assert.equal(result.notificacionEmail?.enviado, false);
    assert.equal(result.notificacionEmail?.estado, 'FALLIDO');
    assert.ok(result.notificacionEmail?.mensaje?.includes('SMTP connection timeout'));
  });

  it('AssignPqrResponsableBackendUseCase debe asignar la PQR y despachar correo al responsable', async () => {
    const pqrRepo = new MockPqrRepository();
    const userRepo = new MockUsuarioRepository();
    let sentOptions: SendEmailOptions | null = null;

    const mockEmailService: EmailService = {
      async sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
        sentOptions = opts;
        return { success: true, estado: 'ENVIADO', messageId: '<msg-resp-456>' };
      },
    };

    const useCase = new AssignPqrResponsableBackendUseCase(
      pqrRepo,
      userRepo,
      mockEmailService,
      'http://localhost:4200'
    );

    const updated = await useCase.execute(10, 20);

    assert.equal(updated.idResponsable, 20);
    assert.equal(updated.estado, 'Asignada');
    assert.equal(updated.notificacionEmail?.enviado, true);
    assert.equal(updated.notificacionEmail?.estado, 'ENVIADO');
    assert.ok(sentOptions);
    assert.equal((sentOptions as SendEmailOptions).to, 'fernando.resp@dolormed.com');
    assert.equal((sentOptions as SendEmailOptions).tipoEvento, 'ASIGNACION_RESPONSABLE');
  });

  it('AssignPqrResponsableBackendUseCase debe rechazar la asignación si el responsable está inactivo', async () => {
    const pqrRepo = new MockPqrRepository();
    const userRepo = new MockUsuarioRepository();

    const useCase = new AssignPqrResponsableBackendUseCase(
      pqrRepo,
      userRepo,
      undefined,
      'http://localhost:4200'
    );

    await assert.rejects(
      async () => {
        await useCase.execute(10, 21); // ID 21 es inactivo
      },
      (err: any) => err instanceof CustomError && err.statusCode === 400 && err.message.includes('inactivo')
    );
  });

  it('AssignPqrResponsableBackendUseCase debe rechazar la asignación si el usuario no tiene rol de Responsable', async () => {
    const pqrRepo = new MockPqrRepository();
    const userRepo = new MockUsuarioRepository();

    const useCase = new AssignPqrResponsableBackendUseCase(
      pqrRepo,
      userRepo,
      undefined,
      'http://localhost:4200'
    );

    await assert.rejects(
      async () => {
        await useCase.execute(10, 22); // ID 22 tiene rol Solicitante (idRol: 1)
      },
      (err: any) => err instanceof CustomError && err.statusCode === 400 && err.message.includes('rol de Responsable')
    );
  });

  it('AssignPqrResponsableBackendUseCase debe rechazar la asignación sobre una PQR en estado terminal (Cerrada)', async () => {
    const pqrRepo = new MockPqrRepository();
    const userRepo = new MockUsuarioRepository();

    const useCase = new AssignPqrResponsableBackendUseCase(
      pqrRepo,
      userRepo,
      undefined,
      'http://localhost:4200'
    );

    await assert.rejects(
      async () => {
        await useCase.execute(30, 20); // ID 30 está Cerrada
      },
      (err: any) => err instanceof CustomError && err.statusCode === 400 && err.message.includes('estado terminal')
    );
  });
});
