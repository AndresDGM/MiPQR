const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LoginDto {
  private constructor(
    public readonly correo: string,
    public readonly password: string
  ) {}

  static create(body: unknown): [string?, LoginDto?] {
    if (!body || typeof body !== 'object') {
      return ['El cuerpo de la peticion debe ser un objeto', undefined];
    }

    const { correo, password } = body as Record<string, unknown>;

    if (typeof correo !== 'string') {
      return ['El correo es requerido', undefined];
    }
    const normalizedCorreo = correo.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedCorreo)) {
      return ['El correo no tiene un formato valido', undefined];
    }

    if (typeof password !== 'string' || password.length === 0) {
      return ['La contrasena es requerida', undefined];
    }

    return [undefined, new LoginDto(normalizedCorreo, password)];
  }
}
