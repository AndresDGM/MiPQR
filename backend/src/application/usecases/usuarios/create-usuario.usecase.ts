import { CreateUsuarioDto } from '../../../domain/dtos/create-usuario.dto.js';
import { CustomError } from '../../../domain/errors/custom.error.js';
import { RolRepository } from '../../../domain/repositories/rol.repository.js';
import { UsuarioRepository } from '../../../domain/repositories/usuario.repository.js';
import { CipherService } from '../../../domain/services/cipher.service.js';
import { toUsuarioPublico, UsuarioPublico } from '../../types/usuario-publico.type.js';

export class CreateUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly rolRepository: RolRepository,
    private readonly passwordCipher: CipherService
  ) {}

  async execute(dto: CreateUsuarioDto): Promise<UsuarioPublico> {
    const rol = await this.rolRepository.getById(dto.idRol);
    if (!rol) {
      throw CustomError.badRequest('El rol especificado no existe');
    }

    const existingCorreo = await this.usuarioRepository.getByCorreo(dto.correo);
    if (existingCorreo) {
      throw CustomError.conflict('El correo ya se encuentra registrado');
    }

    const existingIdentificacion = await this.usuarioRepository.getByIdentificacion(dto.identificacion);
    if (existingIdentificacion) {
      throw CustomError.conflict('La identificacion ya se encuentra registrada');
    }

    // La contrasena se guarda cifrada; nunca en texto plano
    const nuevoUsuario = await this.usuarioRepository.create(
      dto.withPassword(this.passwordCipher.encrypt(dto.password))
    );
    return toUsuarioPublico(nuevoUsuario, rol.nombre);
  }
}
