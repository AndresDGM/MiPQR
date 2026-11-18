import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GetAllPqrsBackendUseCase,
  GetPqrByIdBackendUseCase,
} from '../src/application/usecases/pqrs/pqr.usecases.js';
import {
  CreatePqrData,
  PqrHistoryRecord,
  PqrRecord,
  PqrRepository,
  PqrResponseRecord,
  PqrStatusName,
} from '../src/domain/repositories/pqr.repository.js';
import { CustomError } from '../src/domain/errors/custom.error.js';

class SecurityMockPqrRepository extends PqrRepository {
  private pqrs: PqrRecord[] = [
    {
      idPqr: 1,
      codigoSeguimiento: 'PQR-2026-0001',
      idSolicitante: 5,
      idResponsable: 2,
      idCategoria: 1,
      categoria: 'Atención Médica',
      idEstado: 3,
      estado: 'Asignada',
      tipoPqr: 'Peticion',
      asunto: 'PQR 1',
      descripcion: 'Descripción PQR 1',
      fechaRegistro: new Date(),
    },
    {
      idPqr: 2,
      codigoSeguimiento: 'PQR-2026-0002',
      idSolicitante: 6,
      idResponsable: 3,
      idCategoria: 2,
      categoria: 'Facturación',
      idEstado: 2,
      estado: 'En revision',
      tipoPqr: 'Reclamo',
      asunto: 'PQR 2',
      descripcion: 'Descripción PQR 2',
      fechaRegistro: new Date(),
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

  async create(_data: CreatePqrData): Promise<PqrRecord> {
    throw new Error('Not needed');
  }

  async assignResponsable(): Promise<PqrRecord> {
    throw new Error('Not needed');
  }

  async updateCategoria(): Promise<PqrRecord> {
    throw new Error('Not needed');
  }

  async updateEstado(
    _idPqr: number,
    _idEstado: number,
    _estado: PqrStatusName
  ): Promise<PqrRecord> {
    throw new Error('Not needed');
  }

  async getHistorial(): Promise<PqrHistoryRecord[]> {
    return [];
  }

  async responder(): Promise<PqrResponseRecord> {
    throw new Error('Not needed');
  }
}

describe('Seguridad y control de acceso en consultas PQR', () => {
  it('debe filtrar PQRs segun el rol del actor en GetAllPqrsBackendUseCase', async () => {
    const repo = new SecurityMockPqrRepository();
    const useCase = new GetAllPqrsBackendUseCase(repo);

    const siauList = await useCase.execute(undefined, { idUsuario: 1, rol: 'Analista SIAU' });
    assert.equal(siauList.length, 2);

    const respList = await useCase.execute(undefined, { idUsuario: 2, rol: 'Responsable' });
    assert.equal(respList.length, 1);
    assert.equal(respList[0]?.idPqr, 1);

    const solList = await useCase.execute(undefined, { idUsuario: 6, rol: 'Solicitante' });
    assert.equal(solList.length, 1);
    assert.equal(solList[0]?.idPqr, 2);
  });

  it('debe restringir acceso por ID a solicitantes y responsables ajenos al caso', async () => {
    const repo = new SecurityMockPqrRepository();
    const useCase = new GetPqrByIdBackendUseCase(repo);

    const propia = await useCase.execute(1, { idUsuario: 5, rol: 'Solicitante' });
    assert.equal(propia.idPqr, 1);

    await assert.rejects(
      () => useCase.execute(1, { idUsuario: 6, rol: 'Solicitante' }),
      (err: CustomError) => err.statusCode === 403
    );

    await assert.rejects(
      () => useCase.execute(1, { idUsuario: 3, rol: 'Responsable' }),
      (err: CustomError) => err.statusCode === 403
    );

    const porSiau = await useCase.execute(2, { idUsuario: 1, rol: 'Analista SIAU' });
    assert.equal(porSiau.idPqr, 2);
  });
});
