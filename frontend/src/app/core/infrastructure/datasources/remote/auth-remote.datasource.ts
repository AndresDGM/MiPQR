import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthSession, RegisterPayload } from '../../../domain/models/auth-session.model';

/**
 * Datasource remoto de autenticación contra el Backend Node.js.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class AuthRemoteDatasource {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = environment.baseUrlNode;

  login(correo: string, password: string): Observable<AuthSession> {
    return this.httpClient.post<AuthSession>(`${this.baseUrl}/api/auth/login`, { correo, password });
  }

  register(payload: RegisterPayload): Observable<AuthSession> {
    return this.httpClient.post<AuthSession>(`${this.baseUrl}/api/auth/register`, payload);
  }
}
