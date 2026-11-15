import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthSession, RegisterPayload } from '../../../domain/models/auth-session.model';
import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { CipherService } from '../../../domain/services/cipher.service';
import { AuthRemoteDatasource } from '../../datasources/remote/auth-remote.datasource';

/**
 * Implementación de autenticación que consume el Backend Node.js.
 *
 * El correo y la contraseña se cifran con {@link CipherService} antes de salir del cliente.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable()
export class AuthNodeRepositoryImpl extends AuthRepository {
  private dataSource = inject(AuthRemoteDatasource);
  private cipher = inject(CipherService);

  login(correo: string, password: string): Observable<AuthSession> {
    return this.dataSource
      .login(this.cipher.encrypt(correo), this.cipher.encrypt(password))
      .pipe(catchError((e) => this.toError(e)));
  }

  register(payload: RegisterPayload): Observable<AuthSession> {
    const cifrado: RegisterPayload = {
      ...payload,
      correo: this.cipher.encrypt(payload.correo),
      password: this.cipher.encrypt(payload.password),
    };
    return this.dataSource.register(cifrado).pipe(catchError((e) => this.toError(e)));
  }

  /** El backend responde { error: mensaje }; se expone como Error con ese mensaje. */
  private toError(error: HttpErrorResponse): Observable<never> {
    const mensaje =
      error.status === 0
        ? 'No fue posible conectar con el servidor. Intente nuevamente.'
        : error.error?.error || 'Ocurrió un error inesperado.';
    return throwError(() => new Error(mensaje));
  }
}
