const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_ONLY_REGEX = /^\d{5,15}$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

export class UpdateUsuarioDto {
  private constructor(
    public readonly nombre?: string,
    public readonly correo?: string,
    public readonly identificacion?: string,
    public readonly idRol?: number,
    public readonly telefono?: string | null
  ) {}

  static create(body: unknown): [string?, UpdateUsuarioDto?] {
    if (!body || typeof body !== 'object') {
      return ['El cuerpo de la peticion debe ser un objeto', undefined];
    }

    const { nombre, correo, identificacion, idRol, telefono } = body as Record<string, unknown>;

    if (
      nombre === undefined &&
      correo === undefined &&
      identificacion === undefined &&
      idRol === undefined &&
      telefono === undefined
    ) {
      return ['Debe proporcionar al menos un campo para actualizar', undefined];
    }

    let validNombre: string | undefined;
    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || nombre.trim().length < 3) {
        return ['El nombre debe tener al menos 3 caracteres', undefined];
      }
      validNombre = nombre.trim();
    }

    let validCorreo: string | undefined;
    if (correo !== undefined) {
      if (typeof correo !== 'string') {
        return ['El correo no es valido', undefined];
      }
      const normalized = correo.trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalized)) {
        return ['El correo no tiene un formato valido', undefined];
      }
      validCorreo = normalized;
    }

    let validIdentificacion: string | undefined;
    if (identificacion !== undefined) {
      if (typeof identificacion !== 'string' || !DIGITS_ONLY_REGEX.test(identificacion.trim())) {
        return ['La identificacion debe contener solo digitos y tener entre 5 y 15 caracteres', undefined];
      }
      validIdentificacion = identificacion.trim();
    }

    let validIdRol: number | undefined;
    if (idRol !== undefined) {
      if (typeof idRol !== 'number' || !Number.isInteger(idRol) || idRol < 1 || idRol > 4) {
        return ['El rol es invalido. Debe ser un numero entero entre 1 y 4', undefined];
      }
      validIdRol = idRol;
    }

    let validTelefono: string | null | undefined;
    if (telefono !== undefined) {
      if (telefono === null || String(telefono).trim() === '') {
        validTelefono = null;
      } else {
        const cleaned = String(telefono).trim().replace(/[\s()-]/g, '');
        if (!PHONE_REGEX.test(cleaned)) {
          return ['El telefono debe tener entre 7 y 15 digitos (opcionalmente con +)', undefined];
        }
        validTelefono = cleaned;
      }
    }

    return [
      undefined,
      new UpdateUsuarioDto(validNombre, validCorreo, validIdentificacion, validIdRol, validTelefono),
    ];
  }
}
