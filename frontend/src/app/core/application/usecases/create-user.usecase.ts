import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserPayload, User } from '../../domain/models/user.model';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class CreateUserUseCase {
  private userRepository = inject(UserRepository);

  execute(payload: CreateUserPayload): Observable<User> {
    return this.userRepository.create(payload);
  }
}
