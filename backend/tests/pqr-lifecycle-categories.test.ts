import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Categoria } from '../src/domain/entities/categoria.entity.js';
import { CategoriaRepository } from '../src/domain/repositories/categoria.repository.js';
import { GetAllCategoriasUseCase } from '../src/application/usecases/categorias/get-all-categorias.usecase.js';
import { GetCategoriaByIdUseCase } from '../src/application/usecases/categorias/get-categoria-by-id.usecase.js';
import {
  CreatePqrData,
  PqrHistoryRecord,
  PqrRecord,
  PqrRepository,
  PqrResponseRecord,
  PqrStatusName,
} from '../src/domain/repositories/pqr.repository.js';
import { UpdatePqrEstadoUseCase } from '../src/application/usecases/pqrs/update-pqr-estado.usecase.js';
import { GetPqrHistorialUseCase } from '../src/application/usecases/pqrs/get-pqr-historial.usecase.js';
import { ResponderPqrUseCase } from '../src/application/usecases/pqrs/responder-pqr.usecase.js';
import { CustomError } from '../src/domain/errors/custom.error.js';

class InMemoryCategoriaRepository extends CategoriaRepository {
  private categorias: Categoria[] = [
    new Categoria({ idCategoria: 1, nombre: 'Atención Médica', descripcion: 'Consultas', activa: true }),
    new Categoria({ idCategoria: 2, nombre: 'Facturación', descripcion: 'Cobros', activa: true }),
  ];

  async getAll(): Promise<Categoria[]> {
    return this.categorias;
  }

  async getById(idCategoria: number): Promise<Categoria | null> {
    return this.categorias.find((c) => c.idCategoria === idCategoria) ?? null;
  }
}

class LifecyclePqrRepository extends PqrRepository {
  public pqrs: PqrRecord[] = [
    {
      idPqr: 1,
      codigoSeguimiento: 'PQR-2026-0001',
      idCategoria: 1,
      categoria: 'Atención Médica',
      idEstado: 1,
      estado: 'Recibida',
      tipoPqr: 'Peticion',
      asunto: 'Consulta de historia clínica',
      descripcion: 'Solicito copia completa de mi historia clínica.',
      fechaRegistro: new Date(),
    },
    {
      idPqr: 2,
      codigoSeguimiento: 'PQR-2026-0002',
      idCategoria: 2,
      categoria: 'Facturación',
      idEstado: 6,
      estado: 'Cerrada',
      tipoPqr: 'Reclamo',
      asunto: 'Caso cerrado',
      descripcion: 'Caso ya finalizado.',
      fechaRegistro: new Date(),
      fechaCierre: new Date(),
    },
  ];

  public historial: PqrHistoryRecord[] = [
    {
      idHistorial: 1,
      idPqr: 1,
      idUsuario: null,
      nombreUsuario: null,
      idEstado: 1,
      estado: 'Recibida',
      accion: 'Radicación',
      observacion: 'Solicitud radicada',
      fecha: new Date(),
    },
  ];

  async getAll(): Promise<PqrRecord[]> {
    return this.pqrs;
  }

  async findById(idPqr: number): Promise<PqrRecord | null> {
    return this.pqrs.find((p) => p.idPqr === idPqr) ?? null;
  }

  async findByCodigo(codigo: string): Promise<PqrRecord | null> {
    return this.pqrs.find((p) => p.codigoSeguimiento === codigo) ?? null;
  }

  async create(data: CreatePqrData): Promise<PqrRecord> {
    throw new Error('Not needed');
  }

  async assignResponsable(): Promise<PqrRecord> {
    throw new Error('Not needed');
  }

  async updateCategoria(): Promise<PqrRecord> {
    throw new Error('Not needed');
  }

  async updateEstado(
    idPqr: number,
    idEstado: number,
    estado: PqrStatusName,
    idUsuario?: number | null,
    observacion?: string
  ): Promise<PqrRecord> {
    const pqr = await this.findById(idPqr);
    if (!pqr) throw new Error('No encontrada');
    pqr.idEstado = idEstado;
    pqr.estado = estado;
    if (estado === 'Cerrada') pqr.fechaCierre = new Date();
    this.historial.push({
      idHistorial: this.historial.length + 1,
      idPqr,
      idUsuario: idUsuario ?? null,
      idEstado,
      estado,
      accion: 'Cambio de estado',
      observacion: observacion ?? `Estado actualizado a ${estado}`,
      fecha: new Date(),
    });
    return { ...pqr };
  }

  async getHistorial(idPqr: number): Promise<PqrHistoryRecord[]> {
    return this.historial.filter((h) => h.idPqr === idPqr);
  }

  async responder(idPqr: number, idUsuario: number, contenido: string): Promise<PqrResponseRecord> {
    const pqr = await this.findById(idPqr);
    if (!pqr) throw new Error('No encontrada');
    pqr.idEstado = 5;
    pqr.estado = 'Respondida';
    return {
      idRespuesta: 1,
      idPqr,
      idUsuario,
      nombreUsuario: 'Analista SIAU',
      contenido,
      fechaRespuesta: new Date(),
    };
  }

  async findProximasAVencer(): Promise<PqrRecord[]> {
    return [];
  }

  async markAlertaVencimientoEnviada(): Promise<void> {}
}

describe('Categorias UseCases', () => {
  it('debe listar todas las categorias activas', async () => {
    const useCase = new GetAllCategoriasUseCase(new InMemoryCategoriaRepository());
    const result = await useCase.execute();
    assert.equal(result.length, 2);
    assert.equal(result[0]?.nombre, 'Atención Médica');
  });

  it('debe retornar categoria por ID y lanzar error si ID es invalido o no existe', async () => {
    const useCase = new GetCategoriaByIdUseCase(new InMemoryCategoriaRepository());
    const cat = await useCase.execute(2);
    assert.equal(cat.nombre, 'Facturación');

    await assert.rejects(() => useCase.execute(0), (err: CustomError) => err.statusCode === 400);
    await assert.rejects(() => useCase.execute(999), (err: CustomError) => err.statusCode === 404);
  });
});

describe('Ciclo de vida PQR (estado, historial, respuestas)', () => {
  it('debe permitir transicion valida de estado y registrar en historial', async () => {
    const repo = new LifecyclePqrRepository();
    const updateEstado = new UpdatePqrEstadoUseCase(repo);
    const getHistorial = new GetPqrHistorialUseCase(repo);

    const updated = await updateEstado.execute({
      idPqr: 1,
      estado: 'En revision',
      idUsuario: 1,
      observacion: 'Iniciando revisión SIAU',
    });

    assert.equal(updated.estado, 'En revision');
    assert.equal(updated.idEstado, 2);

    const historial = await getHistorial.execute(1);
    assert.equal(historial.length, 2);
    assert.equal(historial[1]?.observacion, 'Iniciando revisión SIAU');
  });

  it('debe rechazar transiciones invalidas o sobre PQR cerradas', async () => {
    const repo = new LifecyclePqrRepository();
    const updateEstado = new UpdatePqrEstadoUseCase(repo);

    await assert.rejects(
      () => updateEstado.execute({ idPqr: 1, estado: 'EstadoInventado' }),
      (err: CustomError) => err.statusCode === 400
    );

    await assert.rejects(
      () => updateEstado.execute({ idPqr: 1, estado: 'Respondida' }),
      (err: CustomError) => err.statusCode === 400
    );

    await assert.rejects(
      () => updateEstado.execute({ idPqr: 2, estado: 'En gestion' }),
      (err: CustomError) => err.statusCode === 400
    );
  });

  it('debe emitir respuesta formal y validar contenido minimo y estado cerrado', async () => {
    const repo = new LifecyclePqrRepository();
    const responder = new ResponderPqrUseCase(repo);

    await assert.rejects(
      () => responder.execute({ idPqr: 1, idUsuario: 2, contenido: 'corto' }),
      (err: CustomError) => err.statusCode === 400
    );

    await assert.rejects(
      () => responder.execute({ idPqr: 2, idUsuario: 2, contenido: 'Respuesta a caso ya cerrado' }),
      (err: CustomError) => err.statusCode === 400
    );

    const resp = await responder.execute({
      idPqr: 1,
      idUsuario: 2,
      contenido: 'Se adjunta la copia solicitada de su historia clínica.',
    });

    assert.equal(resp.idPqr, 1);
    assert.equal(repo.pqrs[0]?.estado, 'Respondida');
  });
});
