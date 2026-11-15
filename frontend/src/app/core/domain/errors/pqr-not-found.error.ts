import { DomainError } from './domain.error';

/**
 * Error emitido cuando no se encuentra una solicitud PQR por su ID o código de seguimiento.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export class PqrNotFoundError extends DomainError {
  constructor(identifier: number | string) {
    super(`No se encontró la PQR con identificador: ${identifier}`);
  }
}
