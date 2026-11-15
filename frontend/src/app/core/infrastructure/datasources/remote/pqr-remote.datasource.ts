import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PqrHistory } from '../../../domain/models/pqr-history.model';
import { PqrResponse } from '../../../domain/models/pqr-response.model';
import { CreatePqrPayload, Pqr, PqrStatusName } from '../../../domain/models/pqr.model';

/**
 * Datasource remoto para la entidad PQR hacia el backend Node.js.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class PqrRemoteDatasource {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = environment.baseUrlNode;

  getAll(limit?: number): Observable<Pqr[]> {
    const url = limit ? `${this.baseUrl}/api/pqrs?limit=${limit}` : `${this.baseUrl}/api/pqrs`;
    return this.httpClient.get<Pqr[]>(url);
  }

  getById(idPqr: number): Observable<Pqr> {
    return this.httpClient.get<Pqr>(`${this.baseUrl}/api/pqrs/${idPqr}`);
  }

  getByCodigo(codigo: string): Observable<Pqr> {
    return this.httpClient.get<Pqr>(`${this.baseUrl}/api/pqrs/codigo/${codigo}`);
  }

  create(payload: CreatePqrPayload): Observable<Pqr> {
    return this.httpClient.post<Pqr>(`${this.baseUrl}/api/pqrs`, payload);
  }

  updateEstado(idPqr: number, nuevoEstado: PqrStatusName, observacion?: string): Observable<Pqr> {
    return this.httpClient.patch<Pqr>(`${this.baseUrl}/api/pqrs/${idPqr}/estado`, {
      estado: nuevoEstado,
      observacion,
    });
  }

  assignResponsable(idPqr: number, idResponsable: number): Observable<Pqr> {
    return this.httpClient.patch<Pqr>(`${this.baseUrl}/api/pqrs/${idPqr}/responsable`, {
      idResponsable,
    });
  }

  getHistorial(idPqr: number): Observable<PqrHistory[]> {
    return this.httpClient.get<PqrHistory[]>(`${this.baseUrl}/api/pqrs/${idPqr}/historial`);
  }

  responder(idPqr: number, contenido: string): Observable<PqrResponse> {
    return this.httpClient.post<PqrResponse>(`${this.baseUrl}/api/pqrs/${idPqr}/respuestas`, {
      contenido,
    });
  }
}
