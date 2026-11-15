import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthSession, RegisterPayload } from '../../domain/models/auth-session.model';
import { User, UserRoleName } from '../../domain/models/user.model';
import { AuthRepository } from '../../domain/repositories/auth.repository';

/**
 * Servicio de Aplicación para autenticación y estado de sesión de usuarios.
 *
 * @description
 * Administra el usuario activo en sesión mediante Signals reactivos.
 * Depende del contrato {@link AuthRepository}: la fuente real (backend o
 * simulación local) la decide el adapter configurado en la aplicación.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authRepository = inject(AuthRepository);

  private readonly STORAGE_KEY = 'mipqr_current_user';
  private readonly TOKEN_KEY = 'auth_token';

  private _currentUser = signal<User | null>(this.getStoredUser());

  /** Usuario autenticado actualmente */
  readonly currentUser = this._currentUser.asReadonly();

  /** Indica si hay un usuario autenticado */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /** Rol del usuario en sesión */
  readonly userRol = computed<UserRoleName | null>(() => this._currentUser()?.rol ?? null);

  /**
   * Inicia sesión con correo electrónico y contraseña.
   *
   * @param correo Correo electrónico del usuario
   * @param password Contraseña del usuario
   */
  login(correo: string, password: string): Observable<User> {
    return this.authRepository.login(correo.trim(), password).pipe(
      tap((session) => this.setSession(session)),
      map((session) => session.usuario)
    );
  }

  /**
   * Registra una nueva cuenta de solicitante externo.
   *
   * @param payload Datos de registro del solicitante
   */
  registerSolicitante(payload: RegisterPayload): Observable<User> {
    return this.authRepository.register(payload).pipe(
      tap((session) => this.setSession(session)),
      map((session) => session.usuario)
    );
  }

  /**
   * Cierra la sesión activa y limpia las credenciales almacenadas.
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this._currentUser.set(null);
  }

  private setSession(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session.usuario));
      localStorage.setItem(this.TOKEN_KEY, session.token);
    }
    this._currentUser.set(session.usuario);
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
