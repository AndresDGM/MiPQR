import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

/**
 * Caso de uso para obtener el listado de usuarios.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class GetAllUsersUseCase {
  private userRepository = inject(UserRepository);

  /**
   * Ejecuta el caso de uso para obtener los usuarios.
   *
   * @param countUsers Cantidad opcional máxima a recuperar
   * @returns Observable con el arreglo de {@link User}
   */
  execute(countUsers?: number): Observable<User[]> {
    return this.userRepository.getAll(countUsers);
  }
}
