import {
  CreatePqrData,
  PqrRecord,
  PqrRepository,
} from '../../domain/repositories/pqr.repository.js';
import { PqrDatasource } from '../datasources/pqr.datasource.js';

/**
 * Implementación concreta del repositorio de PQR para PostgreSQL.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
export class PqrRepositoryImpl extends PqrRepository {
  constructor(private readonly datasource: PqrDatasource) {
    super();
  }

  getAll(limit?: number): Promise<PqrRecord[]> {
    return this.datasource.getAll(limit);
  }

  findById(idPqr: number): Promise<PqrRecord | null> {
    return this.datasource.findById(idPqr);
  }

  findByCodigo(codigo: string): Promise<PqrRecord | null> {
    return this.datasource.findByCodigo(codigo);
  }

  create(data: CreatePqrData): Promise<PqrRecord> {
    return this.datasource.create(data);
  }

  assignResponsable(idPqr: number, idResponsable: number): Promise<PqrRecord> {
    return this.datasource.assignResponsable(idPqr, idResponsable);
  }

  updateCategoria(
    idPqr: number,
    idCategoria: number,
    categoria: string,
    estadoRevisionIa: 'CONFIRMADA' | 'MODIFICADA',
    idUsuarioRevision?: number | null
  ): Promise<PqrRecord> {
    return this.datasource.updateCategoria(
      idPqr,
      idCategoria,
      categoria,
      estadoRevisionIa,
      idUsuarioRevision
    );
  }
}
