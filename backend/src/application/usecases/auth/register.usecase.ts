import { RegisterDto } from '../../../domain/dtos/register.dto.js';
import { TokenService } from '../../../domain/services/token.service.js';
import { AuthSession } from '../../types/auth-session.js';
import { CreateUsuarioUseCase } from '../usuarios/create-usuario.usecase.js';

export class RegisterUseCase {
  constructor(
    private readonly createUsuarioUseCase: CreateUsuarioUseCase,
    private readonly tokenService: TokenService
  ) {}

  async execute(dto: RegisterDto): Promise<AuthSession> {
    // Reutiliza las validaciones de unicidad (409) y el rol Solicitante fijado en el dto
    const usuario = await this.createUsuarioUseCase.execute(dto.createUsuarioDto);

    const token = this.tokenService.sign({
      sub: String(usuario.idUsuario),
      idRol: usuario.idRol,
      rol: usuario.rol,
    });

    return { token, usuario };
  }
}
