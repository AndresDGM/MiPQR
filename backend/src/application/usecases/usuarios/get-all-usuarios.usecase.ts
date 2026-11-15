import { RolRepository } from '../../../domain/repositories/rol.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { toUsuarioPublico, UsuarioPublico } from '../../types/usuario-publico.type.js';

export class GetAllUsuariosUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly rolRepository: RolRepository
  ) {}

  async execute(count?: number): Promise<UsuarioPublico[]> {
    const [usuarios, roles] = await Promise.all([
      this.usuarioRepository.getAll(count),
      this.rolRepository.getAll(),
    ]);

    const rolMap = new Map(roles.map((r) => [r.idRol, r.nombre]));

    return usuarios.map((usuario) => {
      const rolNombre = rolMap.get(usuario.idRol) ?? 'Solicitante';
      return toUsuarioPublico(usuario, rolNombre);
    });
  }
}
