import { CreateUsuarioDto } from './create-usuario.dto.js';

/** Identificador del rol asignado a todo registro publico */
export const ROL_SOLICITANTE_ID = 1;

export class RegisterDto {
  private constructor(public readonly createUsuarioDto: CreateUsuarioDto) {}

  /**
   * Valida los mismos campos que la creacion de usuarios.
   * El rol se fija siempre a Solicitante: cualquier idRol enviado en el body se ignora.
   */
  static create(body: unknown): [string?, RegisterDto?] {
    if (!body || typeof body !== 'object') {
      return ['El cuerpo de la peticion debe ser un objeto', undefined];
    }

    const [error, createDto] = CreateUsuarioDto.create({ ...body, idRol: ROL_SOLICITANTE_ID });
    if (error) {
      return [error, undefined];
    }

    return [undefined, new RegisterDto(createDto!)];
  }
}
