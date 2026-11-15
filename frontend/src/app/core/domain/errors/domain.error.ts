/**
 * Error base abstracto para todos los errores de la capa de dominio del sistema MiPQR.
 *
 * @description
 * Permite tipar y capturar de forma homogénea las excepciones y reglas
 * no cumplidas dentro del negocio, garantizando la independencia de frameworks.
 *
 * @architecture Clean Architecture
 * @layer Domain
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
