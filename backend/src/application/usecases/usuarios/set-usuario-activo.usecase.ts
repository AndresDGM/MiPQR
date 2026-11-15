import { SetActivoDto } from '../../../domain/dtos/set-activo.dto.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { RolRepository } from '../../../domain/repositories/rol.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { Actor } from '../../types/actor.type.js';
import { toUsuarioPublico, UsuarioPublico } from '../../types/usuario-publico.type.js';

export class SetUsuarioActivoUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly rolRepository: RolRepository
  ) {}

  async execute(idUsuario: number, dto: SetActivoDto, actor: Actor): Promise<UsuarioPublico> {
    if (actor.idUsuario === idUsuario && !dto.activo) {
      throw CustomError.badRequest('No puede desactivar su propia cuenta');
    }

    const updatedUsuario = await this.usuarioRepository.setActivo(idUsuario, dto.activo);
    if (!updatedUsuario) {
      throw CustomError.notFound('Usuario no encontrado');
    }

    const rol = await this.rolRepository.getById(updatedUsuario.idRol);
    if (!rol) {
      throw CustomError.notFound('Rol del usuario no encontrado');
    }

    return toUsuarioPublico(updatedUsuario, rol.nombre);
  }
}
