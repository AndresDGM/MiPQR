import { DomainError } from './domain.error';

/**
 * Error emitido cuando una categoría solicitada no existe en el sistema.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export class CategoryNotFoundError extends DomainError {
  constructor(identifier: number | string) {
    super(`No se encontró la categoría con identificador: ${identifier}`);
  }
}
