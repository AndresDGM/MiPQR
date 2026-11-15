import { inject, Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { AuthSession, RegisterPayload } from '../../../domain/models/auth-session.model';
import { User } from '../../../domain/models/user.model';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { UserLocalDatasource } from '../../datasources/local/user-local.datasource';

/**
 * Implementación de autenticación simulada sobre los usuarios locales en memoria.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class AuthLocalRepositoryImpl extends AuthRepository {
  private userLocalDs = inject(UserLocalDatasource);

  login(correo: string, _password: string): Observable<AuthSession> {
    const cleanEmail = correo.trim().toLowerCase();
    const user = this.userLocalDs.getUsersSync().find((u) => u.correo.toLowerCase() === cleanEmail);

    if (!user) {
      return throwError(
        () => new Error('Credenciales inválidas. No se encontró ningún usuario con este correo.')
      );
    }

    if (!user.activo) {
      return throwError(
        () => new Error('La cuenta de usuario se encuentra inactiva. Contacte al área de soporte.')
      );
    }

    return of(this.toSession(user)).pipe(delay(250));
  }

  register(payload: RegisterPayload): Observable<AuthSession> {
    const users = this.userLocalDs.getUsersSync();
    const cleanEmail = payload.correo.trim().toLowerCase();

    if (users.some((u) => u.correo.toLowerCase() === cleanEmail)) {
      return throwError(
        () => new Error('Ya existe una cuenta registrada con este correo electrónico.')
      );
    }

    const newUser: User = {
      idUsuario: users.length + 1,
      idRol: 1,
      rol: 'Solicitante',
      nombre: payload.nombre.trim(),
      correo: cleanEmail,
      identificacion: payload.identificacion.trim(),
      activo: true,
    };

    this.userLocalDs.addUserSync(newUser);
    return of(this.toSession(newUser)).pipe(delay(300));
  }

  private toSession(usuario: User): AuthSession {
    return { token: `mock-jwt-token-${usuario.idUsuario}-${Date.now()}`, usuario };
  }
}
