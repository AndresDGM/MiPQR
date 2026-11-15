import { DomainError } from './domain.error';

/**
 * Error emitido cuando un usuario solicitado no existe en el sistema.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export class UserNotFoundError extends DomainError {
  constructor(identifier: number | string) {
    super(`No se encontró el usuario con identificador: ${identifier}`);
  }
}
