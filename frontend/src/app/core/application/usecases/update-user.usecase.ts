import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateUserPayload, User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class UpdateUserUseCase {
  private userRepository = inject(UserRepository);

  execute(idUsuario: number, payload: UpdateUserPayload): Observable<User> {
    return this.userRepository.update(idUsuario, payload);
  }
}
