export class Usuario {
  constructor(
    public readonly idUsuario: number,
    public readonly idRol: number,
    public readonly nombre: string,
    public readonly correo: string,
    public readonly identificacion: string,
    public readonly password: string,
    public readonly activo: boolean
  ) {}
}
