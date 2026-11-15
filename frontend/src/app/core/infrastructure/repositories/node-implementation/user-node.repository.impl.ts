import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserRoleName } from '../../../domain/models/user.model';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserRemoteDatasource } from '../../datasources/remote/user-remote.datasource';

/**
 * Implementación del repositorio de usuarios para backend Node.js.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class UserNodeRepositoryImpl extends UserRepository {
  private dataSource = inject(UserRemoteDatasource);

  getAll(countUsers?: number): Observable<User[]> {
    return this.dataSource.getAll(countUsers);
  }

  getById(idUsuario: number): Observable<User> {
    return this.dataSource.getById(idUsuario);
  }

  getByRol(rol: UserRoleName): Observable<User[]> {
    return this.dataSource.getByRol(rol);
  }
}
