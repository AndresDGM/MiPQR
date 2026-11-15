export type RolNombre = 'Solicitante' | 'Analista SIAU' | 'Responsable' | 'Directivo';

export class Rol {
  constructor(
    public readonly idRol: number,
    public readonly nombre: RolNombre,
    public readonly descripcion: string
  ) {}
}
