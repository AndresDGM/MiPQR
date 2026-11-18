import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { UserNotFoundError } from '../../../domain/errors';
import { CreateUserPayload, UpdateUserPayload, User, UserRoleName } from '../../../domain/models/user.model';

/**
 * Datasource local en memoria para la entidad User.
 *
 * @architecture Clean Architecture
 * @layer Infrastructure
 */
@Injectable({
  providedIn: 'root',
})
export class UserLocalDatasource {
  private users: User[] = [
    { idUsuario: 1, idRol: 2, rol: 'Analista SIAU', nombre: 'Carolina Gomez', correo: 'carolina.gomez@dolormed.com', identificacion: '1010101001', activo: true },
    { idUsuario: 2, idRol: 3, rol: 'Responsable', nombre: 'Fernando Salazar', correo: 'fernando.salazar@dolormed.com', identificacion: '1010101002', activo: true },
    { idUsuario: 3, idRol: 3, rol: 'Responsable', nombre: 'Laura Ortiz', correo: 'laura.ortiz@dolormed.com', identificacion: '1010101003', activo: true },
    { idUsuario: 4, idRol: 4, rol: 'Directivo', nombre: 'Maria Valencia', correo: 'maria.valencia@dolormed.com', identificacion: '1010101004', activo: true },
    { idUsuario: 5, idRol: 1, rol: 'Solicitante', nombre: 'Carlos Restrepo', correo: 'carlos.restrepo@gmail.com', identificacion: '1010101005', activo: true },
    { idUsuario: 6, idRol: 1, rol: 'Solicitante', nombre: 'Ana Torres', correo: 'ana.torres@gmail.com', identificacion: '1010101006', activo: false },
  ];


  getAll(count?: number): Observable<User[]> {
    const list = count ? this.users.slice(0, count) : [...this.users];
    return of(list).pipe(delay(200));
  }

  getById(idUsuario: number): Observable<User> {
    const item = this.users.find((u) => u.idUsuario === idUsuario);
    if (!item) {
      return throwError(() => new UserNotFoundError(idUsuario));
    }
    return of({ ...item }).pipe(delay(200));
  }

  getByRol(rol: UserRoleName): Observable<User[]> {
    const filtered = this.users.filter((u) => u.rol === rol);
    return of(filtered).pipe(delay(200));
  }

  create(payload: CreateUserPayload): Observable<User> {
    const rolMap: Record<number, UserRoleName> = {
      1: 'Solicitante',
      2: 'Analista SIAU',
      3: 'Responsable',
      4: 'Directivo',
    };
    const nextId = Math.max(...this.users.map((u) => u.idUsuario), 0) + 1;
    const created: User = {
      idUsuario: nextId,
      idRol: payload.idRol,
      rol: rolMap[payload.idRol] ?? 'Solicitante',
      nombre: payload.nombre,
      correo: payload.correo,
      identificacion: payload.identificacion,
      activo: true,
    };
    this.users.push(created);
    return of({ ...created }).pipe(delay(200));
  }

  update(idUsuario: number, payload: UpdateUserPayload): Observable<User> {
    const idx = this.users.findIndex((u) => u.idUsuario === idUsuario);
    if (idx === -1) return throwError(() => new UserNotFoundError(idUsuario));
    const rolMap: Record<number, UserRoleName> = {
      1: 'Solicitante',
      2: 'Analista SIAU',
      3: 'Responsable',
      4: 'Directivo',
    };
    const current = this.users[idx]!;
    const updated: User = {
      ...current,
      ...payload,
      rol: payload.idRol ? (rolMap[payload.idRol] ?? current.rol) : current.rol,
    };
    this.users[idx] = updated;
    return of({ ...updated }).pipe(delay(200));
  }

  setActivo(idUsuario: number, activo: boolean): Observable<User> {
    const idx = this.users.findIndex((u) => u.idUsuario === idUsuario);
    if (idx === -1) return throwError(() => new UserNotFoundError(idUsuario));
    this.users[idx] = { ...this.users[idx]!, activo };
    return of({ ...this.users[idx]! }).pipe(delay(200));
  }

  /**
   * Helper síncrono para generación de mocks cruzados.
   */
  getUsersSync(): User[] {
    return [...this.users];
  }

  /**
   * Agrega un usuario a la memoria local.
   */
  addUserSync(user: User): void {
    this.users.push(user);
  }
}
