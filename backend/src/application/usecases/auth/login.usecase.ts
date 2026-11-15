import { LoginDto } from '../../../domain/dtos/login.dto.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { RolRepository } from '../../../domain/repositories/rol.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { CipherService } from '../../../domain/services/cipher.service.js';
import { TokenService } from '../../../domain/services/token.service.js';
import { AuthSession } from '../../types/auth-session.js';
import { toUsuarioPublico } from '../../types/usuario-publico.type.js';

export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly rolRepository: RolRepository,
    private readonly tokenService: TokenService,
    private readonly passwordCipher: CipherService
  ) {}

  private verifyPassword(plainPassword: string, storedPassword: string): boolean {
    try {
      return this.passwordCipher.decrypt(storedPassword) === plainPassword;
    } catch {
      // Valor almacenado ilegible: se trata como credenciales invalidas
      return false;
    }
  }

  async execute(dto: LoginDto): Promise<AuthSession> {
    const usuario = await this.usuarioRepository.getByCorreo(dto.correo);
    if (!usuario || !this.verifyPassword(dto.password, usuario.password)) {
      throw CustomError.unauthorized('Credenciales invalidas');
    }

    if (!usuario.activo) {
      throw CustomError.unauthorized('Usuario inactivo');
    }

    const rol = await this.rolRepository.getById(usuario.idRol);
    if (!rol) {
      throw CustomError.notFound('Rol del usuario no encontrado');
    }

    const token = this.tokenService.sign({
      sub: String(usuario.idUsuario),
      idRol: usuario.idRol,
      rol: rol.nombre,
    });

    return { token, usuario: toUsuarioPublico(usuario, rol.nombre) };
  }
}
