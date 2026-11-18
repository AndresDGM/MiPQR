import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class SetUserActivoUseCase {
  private userRepository = inject(UserRepository);

  execute(idUsuario: number, activo: boolean): Observable<User> {
    return this.userRepository.setActivo(idUsuario, activo);
  }
}
