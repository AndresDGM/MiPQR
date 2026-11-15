import { CustomError } from '../../../domain/errors/custom.error.js';
import { RolRepository } from '../../../domain/repositories/rol.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { Actor } from '../../types/actor.type.js';
import { toUsuarioPublico, UsuarioPublico } from '../../types/usuario-publico.type.js';

export class GetUsuarioByIdUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly rolRepository: RolRepository
  ) {}

  async execute(idUsuario: number, actor: Actor): Promise<UsuarioPublico> {
    // Un Solicitante solo puede consultar su propio usuario
    if (actor.rol === 'Solicitante' && actor.idUsuario !== idUsuario) {
      throw CustomError.forbidden('No tiene permisos para realizar esta accion');
    }

    const usuario = await this.usuarioRepository.getById(idUsuario);
    if (!usuario) {
      throw CustomError.notFound('Usuario no encontrado');
    }

    const rol = await this.rolRepository.getById(usuario.idRol);
    if (!rol) {
      throw CustomError.notFound('Rol del usuario no encontrado');
    }

    return toUsuarioPublico(usuario, rol.nombre);
  }
}
