export class SetActivoDto {
  private constructor(public readonly activo: boolean) {}

  static create(body: unknown): [string?, SetActivoDto?] {
    if (!body || typeof body !== 'object') {
      return ['El cuerpo de la peticion debe ser un objeto', undefined];
    }

    const { activo } = body as Record<string, unknown>;

    if (typeof activo !== 'boolean') {
      return ['El campo activo es requerido y debe ser un valor booleano', undefined];
    }

    return [undefined, new SetActivoDto(activo)];
  }
}
