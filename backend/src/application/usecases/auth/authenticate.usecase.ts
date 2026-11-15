import { CustomError } from '../../../domain/errors/custom.error.js';
import { RolRepository } from '../../../domain/repositories/rol.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { TokenService } from '../../../domain/services/token.service.js';
import { toUsuarioPublico, UsuarioPublico } from '../../types/usuario-publico.type.js';

const USUARIO_NO_VIGENTE = 'Usuario inactivo o inexistente';

/**
 * Valida un token y recarga el usuario desde la base.
 * Asi, desactivar a alguien o cambiar su rol surte efecto aunque su token siga vigente.
 */
export class AuthenticateUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly rolRepository: RolRepository
  ) {}

  async execute(token: string): Promise<UsuarioPublico> {
    const payload = this.tokenService.verify(token);

    const usuario = await this.usuarioRepository.getById(Number(payload.sub));
    if (!usuario || !usuario.activo) {
      throw CustomError.unauthorized(USUARIO_NO_VIGENTE);
    }

    const rol = await this.rolRepository.getById(usuario.idRol);
    if (!rol) {
      throw CustomError.notFound('Rol del usuario no encontrado');
    }

    return toUsuarioPublico(usuario, rol.nombre);
  }
}
