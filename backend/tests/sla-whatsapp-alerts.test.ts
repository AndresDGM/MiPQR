import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TwilioWhatsAppService } from '../src/infrastructure/services/twilio-whatsapp.service.js';
import { SendWhatsAppOptions, SendWhatsAppResult, WhatsAppService } from '../src/domain/services/whatsapp.service.js';
import { EmailService, SendEmailOptions, SendEmailResult } from '../src/domain/services/email.service.js';
import {
  CreatePqrData,
  PqrHistoryRecord,
  PqrRecord,
  PqrRepository,
  PqrResponseRecord,
  PqrStatusName,
} from '../src/domain/repositories/pqr.repository.js';
import { UsuarioRepository } from '../src/domain/repositories/usuario.repository.js';
import { Usuario } from '../src/domain/entities/usuario.entity.js';
import { ResponderPqrUseCase } from '../src/application/usecases/pqrs/responder-pqr.usecase.js';
import { CheckSlaAlertsUseCase } from '../src/application/usecases/pqrs/check-sla-alerts.usecase.js';

class SpyEmailService extends EmailService {
  public sent: SendEmailOptions[] = [];

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    this.sent.push(options);
    return { success: true, estado: 'ENVIADO', messageId: 'msg-1' };
  }
}

class SpyWhatsAppService extends WhatsAppService {
  public sent: SendWhatsAppOptions[] = [];

  async sendMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    this.sent.push(options);
    return { success: true, estado: 'SIMULADO', simulated: true, sid: 'SM_1' };
  }
}

class SlaMockPqrRepository extends PqrRepository {
  public pqrs: PqrRecord[] = [
    {
      idPqr: 1,
      codigoSeguimiento: 'PQR-2026-0001',
      idCategoria: 1,
      categoria: 'Atención Médica',
      idEstado: 3,
      estado: 'Asignada',
      idResponsable: 2,
      tipoPqr: 'Peticion',
      asunto: 'Historia clínica',
      descripcion: 'Solicito copia de historia clínica.',
      nombreSolicitante: 'Carlos Restrepo',
      correoSolicitante: 'carlos@test.com',
      telefonoSolicitante: '3001234567',
      fechaRegistro: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      fechaLimite: new Date(Date.now() + 12 * 60 * 60 * 1000),
      alertaVencimientoEnviada: false,
    },
  ];

  async getAll(): Promise<PqrRecord[]> { return this.pqrs; }
  async findById(idPqr: number): Promise<PqrRecord | null> {
    return this.pqrs.find((p) => p.idPqr === idPqr) ?? null;
  }
  async findByCodigo(codigo: string): Promise<PqrRecord | null> {
    return this.pqrs.find((p) => p.codigoSeguimiento === codigo) ?? null;
  }
  async create(_data: CreatePqrData): Promise<PqrRecord> { throw new Error('Not needed'); }
  async assignResponsable(): Promise<PqrRecord> { throw new Error('Not needed'); }
  async updateCategoria(): Promise<PqrRecord> { throw new Error('Not needed'); }
  async updateEstado(_id: number, _idE: number, _e: PqrStatusName): Promise<PqrRecord> {
    throw new Error('Not needed');
  }
  async getHistorial(): Promise<PqrHistoryRecord[]> { return []; }
  async responder(idPqr: number, idUsuario: number, contenido: string): Promise<PqrResponseRecord> {
    return {
      idRespuesta: 1,
      idPqr,
      idUsuario,
      nombreUsuario: 'Dr. Salazar',
      contenido,
      fechaRespuesta: new Date(),
    };
  }
  async findProximasAVencer(): Promise<PqrRecord[]> {
    return this.pqrs.filter((p) => !p.alertaVencimientoEnviada);
  }
  async markAlertaVencimientoEnviada(idPqr: number): Promise<void> {
    const p = this.pqrs.find((item) => item.idPqr === idPqr);
    if (p) p.alertaVencimientoEnviada = true;
  }
}

class SlaMockUsuarioRepository extends UsuarioRepository {
  private users: Usuario[] = [
    new Usuario(1, 2, 'Carolina Gomez', 'siau@test.com', '1001', 'hash', true, '3101111111'),
    new Usuario(2, 3, 'Fernando Salazar', 'resp@test.com', '1002', 'hash', true, '3202222222'),
  ];

  async getAll(): Promise<Usuario[]> { return this.users; }
  async getById(id: number): Promise<Usuario | null> {
    return this.users.find((u) => u.idUsuario === id) ?? null;
  }
  async getByCorreo(): Promise<Usuario | null> { return null; }
  async getByRol(): Promise<Usuario[]> { return []; }
  async create(): Promise<Usuario> { throw new Error('Not needed'); }
  async update(): Promise<Usuario> { throw new Error('Not needed'); }
  async setActivo(): Promise<Usuario> { throw new Error('Not needed'); }
}

describe('TwilioWhatsAppService', () => {
  it('debe normalizar numeros colombianos y operar en modo simulado sin credenciales', async () => {
    assert.equal(TwilioWhatsAppService.formatWhatsAppNumber('3001234567'), 'whatsapp:+573001234567');
    assert.equal(TwilioWhatsAppService.formatWhatsAppNumber('+573001234567'), 'whatsapp:+573001234567');

    const service = new TwilioWhatsAppService({ from: 'whatsapp:+14155238886' });
    const res = await service.sendMessage({ to: '3001234567', body: 'Prueba SLA' });
    assert.equal(res.success, true);
    assert.equal(res.estado, 'SIMULADO');
  });
});

describe('Alertas por Correo y WhatsApp (Respuesta y SLA)', () => {
  it('ResponderPqrUseCase debe notificar al solicitante por correo y WhatsApp', async () => {
    const pqrRepo = new SlaMockPqrRepository();
    const emailSpy = new SpyEmailService();
    const waSpy = new SpyWhatsAppService();

    const useCase = new ResponderPqrUseCase(pqrRepo, emailSpy, waSpy, 'https://mipqr.example');
    await useCase.execute({
      idPqr: 1,
      idUsuario: 2,
      contenido: 'Adjuntamos la copia de su historia clínica solicitada.',
    });

    assert.equal(emailSpy.sent.length, 1);
    assert.equal(emailSpy.sent[0]?.to, 'carlos@test.com');
    assert.equal(emailSpy.sent[0]?.tipoEvento, 'RESPUESTA_PQR');

    assert.equal(waSpy.sent.length, 1);
    assert.equal(waSpy.sent[0]?.to, '3001234567');
    assert.equal(waSpy.sent[0]?.tipoEvento, 'RESPUESTA_PQR');
  });

  it('CheckSlaAlertsUseCase debe alertar una sola vez al responsable por vencimiento cercano', async () => {
    const pqrRepo = new SlaMockPqrRepository();
    const userRepo = new SlaMockUsuarioRepository();
    const emailSpy = new SpyEmailService();
    const waSpy = new SpyWhatsAppService();

    const useCase = new CheckSlaAlertsUseCase(pqrRepo, userRepo, emailSpy, waSpy);

    const first = await useCase.execute();
    assert.equal(first.alertadas, 1);
    assert.equal(emailSpy.sent[0]?.to, 'resp@test.com');
    assert.equal(waSpy.sent[0]?.to, '3202222222');

    // Segunda ejecución no debe duplicar la alerta
    const second = await useCase.execute();
    assert.equal(second.alertadas, 0);
    assert.equal(emailSpy.sent.length, 1);
  });
});
