import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PqrHistory } from '../../../domain/models/pqr-history.model';
import { PqrResponse } from '../../../domain/models/pqr-response.model';
import { CreatePqrPayload, Pqr, PqrStatusName } from '../../../domain/models/pqr.model';
import { PqrRepository } from '../../../domain/repositories/pqr.repository';
import { PqrLocalDatasource } from '../../datasources/local/pqr-local.datasource';

/**
 * Implementación local del repositorio de PQRs.
 *
 * @remarks
 * Pertenece a la **capa de Infraestructura** y actúa como un **Adapter**
 * entre el contrato del dominio {@link PqrRepository} y el datasource local simulado
 * con Faker {@link PqrLocalDatasource}.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 *
 * @see {@link PqrRepository}
 * @see {@link PqrLocalDatasource}
 */
@Injectable()
export class PqrLocalRepositoryImpl extends PqrRepository {
  private dataSource = inject(PqrLocalDatasource);

  getAll(limit?: number): Observable<Pqr[]> {
    return this.dataSource.getAll(limit);
  }

  getById(idPqr: number): Observable<Pqr> {
    return this.dataSource.getById(idPqr);
  }

  getByCodigoSeguimiento(codigoSeguimiento: string): Observable<Pqr> {
    return this.dataSource.getByCodigo(codigoSeguimiento);
  }

  create(payload: CreatePqrPayload): Observable<Pqr> {
    return this.dataSource.create(payload);
  }

  updateEstado(idPqr: number, nuevoEstado: PqrStatusName, observacion?: string): Observable<Pqr> {
    return this.dataSource.updateEstado(idPqr, nuevoEstado, observacion);
  }

  assignResponsable(idPqr: number, idResponsable: number): Observable<Pqr> {
    return this.dataSource.assignResponsable(idPqr, idResponsable);
  }

  getHistorial(idPqr: number): Observable<PqrHistory[]> {
    return this.dataSource.getHistorial(idPqr);
  }

  responder(idPqr: number, contenido: string): Observable<PqrResponse> {
    return this.dataSource.responder(idPqr, contenido);
  }
}
