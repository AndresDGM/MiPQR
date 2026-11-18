import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HttpPqrClassificationAdapter } from '../src/infrastructure/repositories/http-pqr-classification.adapter.js';
import { ClassifyPqrUseCase } from '../src/application/usecases/pqrs/classify-pqr.usecase.js';
import {
  CreatePqrBackendUseCase,
  UpdatePqrCategoriaUseCase,
} from '../src/application/usecases/pqrs/pqr.usecases.js';
import {
  ClassificationResult,
  PQRClassificationRepository,
} from '../src/domain/repositories/pqr-classification.repository.js';
import {
  CreatePqrData,
  PqrHistoryRecord,
  PqrRecord,
  PqrRepository,
  PqrResponseRecord,
  PqrStatusName,
} from '../src/domain/repositories/pqr.repository.js';
import { CustomError } from '../src/domain/errors/custom.error.js';

/**
 * Mock en memoria de PQRClassificationRepository para pruebas unitarias desacopladas.
 */
class MockClassificationRepository extends PQRClassificationRepository {
  constructor(
    private readonly shouldFail: boolean = false,
    private readonly mockResult: ClassificationResult | null = {
      categoriaPredicha: 'Atención Médica',
      indiceClase: 0,
      confianza: 0.942,
      claseModeloOriginal: 'Kama',
      versionModelo: '1.0.0-academic-mlp',
      metodoInferencia: 'mlp_seeds_adapter',
    }
  ) {
    super();
  }

  async classify(texto: string, features?: number[]): Promise<ClassificationResult | null> {
    if (this.shouldFail) {
      throw new Error('Servicio de IA inalcanzable');
    }
    return this.mockResult;
  }
}

/**
 * Mock en memoria de PqrRepository para pruebas unitarias.
 */
class InMemoryPqrRepository extends PqrRepository {
  public pqrs: PqrRecord[] = [];

  async getAll(limit?: number): Promise<PqrRecord[]> {
    return this.pqrs;
  }

  async findById(idPqr: number): Promise<PqrRecord | null> {
    return this.pqrs.find((p) => p.idPqr === idPqr) || null;
  }

  async findByCodigo(codigo: string): Promise<PqrRecord | null> {
    return this.pqrs.find((p) => p.codigoSeguimiento === codigo) || null;
  }

  async create(data: CreatePqrData): Promise<PqrRecord> {
    const record: PqrRecord = {
      idPqr: this.pqrs.length + 1,
      codigoSeguimiento: `PQR-2026-${String(this.pqrs.length + 1).padStart(4, '0')}`,
      idSolicitante: data.idSolicitante ?? null,
      nombreSolicitante: data.nombreSolicitante,
      correoSolicitante: data.correoSolicitante,
      identificacionSolicitante: data.identificacionSolicitante,
      idCategoria: data.idCategoria,
      categoria: 'General',
      idEstado: 1,
      estado: 'Recibida',
      tipoPqr: data.tipoPqr,
      asunto: data.asunto,
      descripcion: data.descripcion,
      fechaRegistro: new Date(),
      categoriaSugeridaIa: data.categoriaSugeridaIa ?? null,
      confianzaIa: data.confianzaIa ?? null,
      estadoRevisionIa: data.categoriaSugeridaIa ? 'PENDIENTE' : undefined,
      fechaClasificacionIa: data.categoriaSugeridaIa ? new Date() : null,
      versionModeloIa: data.versionModeloIa ?? null,
    };
    this.pqrs.push(record);
    return record;
  }

  async updateCategoria(
    idPqr: number,
    idCategoria: number,
    categoria: string,
    estadoRevisionIa: 'CONFIRMADA' | 'MODIFICADA',
    idUsuarioRevision?: number | null
  ): Promise<PqrRecord> {
    const pqr = await this.findById(idPqr);
    if (!pqr) throw new Error('No encontrada');
    pqr.idCategoria = idCategoria;
    pqr.categoria = categoria;
    pqr.estadoRevisionIa = estadoRevisionIa;
    pqr.idUsuarioRevisionIa = idUsuarioRevision ?? null;
    return pqr;
  }

  async assignResponsable(): Promise<PqrRecord> {
    throw new Error('Not implemented in mock');
  }

  async updateEstado(
    idPqr: number,
    idEstado: number,
    estado: PqrStatusName
  ): Promise<PqrRecord> {
    const pqr = await this.findById(idPqr);
    if (!pqr) throw new Error('No encontrada');
    pqr.idEstado = idEstado;
    pqr.estado = estado;
    return pqr;
  }

  async getHistorial(): Promise<PqrHistoryRecord[]> {
    return [];
  }

  async responder(): Promise<PqrResponseRecord> {
    throw new Error('Not implemented in mock');
  }

  async findProximasAVencer(): Promise<PqrRecord[]> {
    return [];
  }

  async markAlertaVencimientoEnviada(): Promise<void> {}
}

describe('HttpPqrClassificationAdapter', () => {
  it('debe manejar errores de conexion o timeout retornando null sin lanzar excepcion', async () => {
    // Apuntamos a un puerto donde no hay ningún servicio escuchando
    const adapter = new HttpPqrClassificationAdapter('http://127.0.0.1:59999', 300);
    const result = await adapter.classify('Demora en atención de consulta médica externa');

    // Debe degradarse suavemente (fallback graceful)
    assert.strictEqual(result, null);
  });
});

describe('ClassifyPqrUseCase', () => {
  it('debe retornar la clasificacion obtenida del repositorio de IA', async () => {
    const mockRepo = new MockClassificationRepository();
    const useCase = new ClassifyPqrUseCase(mockRepo);

    const result = await useCase.execute('Demora en atención médica con especialista');
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.categoriaPredicha, 'Atención Médica');
    assert.strictEqual(result?.indiceClase, 0);
    assert.ok(result && result.confianza > 0.9);
  });

  it('debe retornar null cuando el servicio de clasificacion no este disponible', async () => {
    const mockRepo = new MockClassificationRepository(false, null);
    const useCase = new ClassifyPqrUseCase(mockRepo);

    const result = await useCase.execute('Consulta de trámite');
    assert.strictEqual(result, null);
  });
});

describe('CreatePqrBackendUseCase con IA', () => {
  it('debe clasificar automaticamente la PQR al momento de la radicacion si el servicio esta activo', async () => {
    const pqrRepo = new InMemoryPqrRepository();
    const classRepo = new MockClassificationRepository();
    const useCase = new CreatePqrBackendUseCase(pqrRepo, classRepo);

    const pqr = await useCase.execute({
      tipoPqr: 'Queja',
      idCategoria: 1,
      asunto: 'Cobro de cuota moderadora indebido',
      descripcion: 'Se realizó un cobro no justificado en el módulo de facturación.',
      nombreSolicitante: 'Ana Pérez',
      correoSolicitante: 'ana.perez@example.com',
      identificacionSolicitante: '1098765432',
    });

    assert.strictEqual(pqr.categoriaSugeridaIa, 'Atención Médica');
    assert.strictEqual(pqr.confianzaIa, 0.942);
    assert.strictEqual(pqr.versionModeloIa, '1.0.0-academic-mlp');
    assert.strictEqual(pqr.estadoRevisionIa, 'PENDIENTE');
  });

  it('debe radicar la PQR normalmente aun si el servicio de clasificacion de IA falla o esta caido', async () => {
    const pqrRepo = new InMemoryPqrRepository();
    const classRepo = new MockClassificationRepository(true); // Falla intencional
    const useCase = new CreatePqrBackendUseCase(pqrRepo, classRepo);

    const pqr = await useCase.execute({
      tipoPqr: 'Peticion',
      idCategoria: 2,
      asunto: 'Solicitud copia historia clinica',
      descripcion: 'Requiero resumen de atencion.',
      nombreSolicitante: 'Juan Gomez',
      correoSolicitante: 'juan.gomez@example.com',
      identificacionSolicitante: '1098765433',
    });

    // La PQR debe radicarse exitosamente sin interrumpir el flujo del usuario
    assert.ok(pqr.idPqr > 0);
    assert.strictEqual(pqr.categoriaSugeridaIa, null);
    assert.strictEqual(pqr.confianzaIa, null);
  });
});

describe('UpdatePqrCategoriaUseCase', () => {
  it('debe permitir al analista SIAU confirmar la sugerencia de la IA', async () => {
    const pqrRepo = new InMemoryPqrRepository();
    const pqrInicial = await pqrRepo.create({
      tipoPqr: 'Reclamo',
      idCategoria: 1,
      asunto: 'Problema en facturacion',
      descripcion: 'Error en copago liquidado.',
      nombreSolicitante: 'Maria Ruiz',
      correoSolicitante: 'maria.ruiz@example.com',
      identificacionSolicitante: '1098765434',
      categoriaSugeridaIa: 'Facturación',
      confianzaIa: 0.98,
    });

    const useCase = new UpdatePqrCategoriaUseCase(pqrRepo);
    const updated = await useCase.execute({
      idPqr: pqrInicial.idPqr,
      idCategoria: 2,
      categoria: 'Facturación',
      estadoRevisionIa: 'CONFIRMADA',
      idUsuarioRevision: 2,
    });

    assert.strictEqual(updated.categoria, 'Facturación');
    assert.strictEqual(updated.idCategoria, 2);
    assert.strictEqual(updated.estadoRevisionIa, 'CONFIRMADA');
    assert.strictEqual(updated.idUsuarioRevisionIa, 2);
  });

  it('debe permitir al analista SIAU modificar la categoria sugerida por la IA', async () => {
    const pqrRepo = new InMemoryPqrRepository();
    const pqrInicial = await pqrRepo.create({
      tipoPqr: 'Queja',
      idCategoria: 1,
      asunto: 'No hay citas disponibles',
      descripcion: 'Agenda medica cerrada.',
      nombreSolicitante: 'Pedro Castro',
      correoSolicitante: 'pedro.castro@example.com',
      identificacionSolicitante: '1098765435',
      categoriaSugeridaIa: 'Farmacia',
      confianzaIa: 0.55,
    });

    const useCase = new UpdatePqrCategoriaUseCase(pqrRepo);
    const updated = await useCase.execute({
      idPqr: pqrInicial.idPqr,
      idCategoria: 1,
      categoria: 'Atención Médica',
      estadoRevisionIa: 'MODIFICADA',
      idUsuarioRevision: 2,
    });

    assert.strictEqual(updated.categoria, 'Atención Médica');
    assert.strictEqual(updated.idCategoria, 1);
    assert.strictEqual(updated.estadoRevisionIa, 'MODIFICADA');
  });

  it('debe rechazar estados de revision invalidos', async () => {
    const pqrRepo = new InMemoryPqrRepository();
    const pqrInicial = await pqrRepo.create({
      tipoPqr: 'Peticion',
      idCategoria: 1,
      asunto: 'Asunto de prueba',
      descripcion: 'Descripcion de prueba.',
      nombreSolicitante: 'Prueba',
      correoSolicitante: 'prueba@example.com',
      identificacionSolicitante: '1098765436',
    });

    const useCase = new UpdatePqrCategoriaUseCase(pqrRepo);

    await assert.rejects(
      async () => {
        await useCase.execute({
          idPqr: pqrInicial.idPqr,
          idCategoria: 1,
          categoria: 'Atención Médica',
          estadoRevisionIa: 'INVALIDO' as any,
        });
      },
      (err: any) => err instanceof CustomError && err.statusCode === 400
    );
  });
});
