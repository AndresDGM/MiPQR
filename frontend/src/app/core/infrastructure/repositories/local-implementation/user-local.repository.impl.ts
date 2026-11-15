import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserRoleName } from '../../../domain/models/user.model';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserLocalDatasource } from '../../datasources/local/user-local.datasource';

/**
 * Implementación local del repositorio de usuarios con Faker.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class UserLocalRepositoryImpl extends UserRepository {
  private dataSource = inject(UserLocalDatasource);

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
