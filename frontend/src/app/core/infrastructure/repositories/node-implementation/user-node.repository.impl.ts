import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserPayload, UpdateUserPayload, User, UserRoleName } from '../../../domain/models/user.model';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { CipherService } from '../../../domain/services/cipher.service';
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
  private cipher = inject(CipherService);

  getAll(countUsers?: number): Observable<User[]> {
    return this.dataSource.getAll(countUsers);
  }

  getById(idUsuario: number): Observable<User> {
    return this.dataSource.getById(idUsuario);
  }

  getByRol(rol: UserRoleName): Observable<User[]> {
    return this.dataSource.getByRol(rol);
  }

  create(payload: CreateUserPayload): Observable<User> {
    return this.dataSource.create({
      ...payload,
      correo: this.cipher.encrypt(payload.correo),
      password: this.cipher.encrypt(payload.password),
    });
  }

  update(idUsuario: number, payload: UpdateUserPayload): Observable<User> {
    const encrypted: UpdateUserPayload = {
      ...payload,
      ...(payload.correo ? { correo: this.cipher.encrypt(payload.correo) } : {}),
    };
    return this.dataSource.update(idUsuario, encrypted);
  }

  setActivo(idUsuario: number, activo: boolean): Observable<User> {
    return this.dataSource.setActivo(idUsuario, activo);
  }
}
