import { CustomError } from '../../../domain/errors/custom.error.js';
import { RolRepository } from '../../../domain/repositories/rol.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { toUsuarioPublico, UsuarioPublico } from '../../types/usuario-publico.type.js';

export class GetUsuariosByRolUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly rolRepository: RolRepository
  ) {}

  async execute(nombreRol: string): Promise<UsuarioPublico[]> {
    const rol = await this.rolRepository.getByNombre(nombreRol);
    if (!rol) {
      throw CustomError.notFound('Rol no encontrado');
    }

    const usuarios = await this.usuarioRepository.getByRol(rol.idRol);
    return usuarios.map((usuario) => toUsuarioPublico(usuario, rol.nombre));
  }
}
