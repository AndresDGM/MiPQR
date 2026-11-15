import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

/**
 * Caso de uso para obtener un usuario por su identificador.
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class GetUserByIdUseCase {
  private userRepository = inject(UserRepository);

  /**
   * Ejecuta el caso de uso para buscar un usuario por ID.
   *
   * @param idUsuario Identificador numérico del usuario
   * @returns Observable con el {@link User}
   */
  execute(idUsuario: number): Observable<User> {
    return this.userRepository.getById(idUsuario);
  }
}
