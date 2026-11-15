import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { User, UserRoleName } from '../../../domain/models/user.model';

/**
 * Datasource remoto para la entidad User hacia el backend Node.js.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class UserRemoteDatasource {
  private httpClient = inject(HttpClient);
  private readonly baseUrl = environment.baseUrlNode;

  getAll(countUsers?: number): Observable<User[]> {
    const url = countUsers
      ? `${this.baseUrl}/api/users?count=${countUsers}`
      : `${this.baseUrl}/api/users`;
    return this.httpClient.get<User[]>(url);
  }

  getById(idUsuario: number): Observable<User> {
    return this.httpClient.get<User>(`${this.baseUrl}/api/users/${idUsuario}`);
  }

  getByRol(rol: UserRoleName): Observable<User[]> {
    return this.httpClient.get<User[]>(`${this.baseUrl}/api/users/rol/${rol}`);
  }
}
