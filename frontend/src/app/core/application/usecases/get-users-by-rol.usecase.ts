import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserRoleName } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

/**
 * Caso de uso para obtener usuarios filtrados por su rol (ej: Responsables para asignación).
 *
 * @architecture Clean Architecture
 * @layer Application
 */
@Injectable()
export class GetUsersByRolUseCase {
  private userRepository = inject(UserRepository);

  /**
   * Ejecuta el caso de uso filtrando usuarios por rol.
   *
   * @param rol Nombre del rol
   * @returns Observable con la lista de {@link User}
   */
  execute(rol: UserRoleName): Observable<User[]> {
    return this.userRepository.getByRol(rol);
  }
}
