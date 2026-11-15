/**
 * Roles disponibles en el sistema MiPQR.
 *
 * @remarks
 * Define los niveles de acceso y responsabilidades de los usuarios:
 * - 'Solicitante': Paciente o usuario externo que radica y consulta sus PQRs.
 * - 'Analista SIAU': Funcionario de atención al usuario encargado de clasificar y asignar.
 * - 'Responsable': Profesional o jefe de área encargado de gestionar y responder el caso.
 * - 'Directivo': Personal de coordinación y dirección con acceso a reportes y métricas.
 *
 * @example
 * ```ts
 * const rol: UserRoleName = 'Analista SIAU';
 * ```
 */
export type UserRoleName = 'Solicitante' | 'Analista SIAU' | 'Responsable' | 'Directivo';

/**
 * Interfaz que representa un rol del sistema.
 */
export interface Role {
  /** Identificador único del rol */
  idRol: number;

  /** Nombre del rol */
  nombre: UserRoleName;

  /** Descripción de los privilegios o funciones del rol */
  descripcion: string;
}

/**
 * Interfaz que representa un usuario del sistema MiPQR.
 *
 * @description
 * Modela tanto a los usuarios internos de la institución (SIAU, responsables, directivos)
 * como a los solicitantes registrados en la plataforma.
 *
 * @example
 * ```ts
 * const usuario: User = {
 *   idUsuario: 1,
 *   idRol: 2,
 *   rol: 'Analista SIAU',
 *   nombre: 'Carolina Restrepo',
 *   correo: 'carolina.restrepo@dolormed.com',
 *   identificacion: '1116234567',
 *   activo: true
 * };
 * ```
 */
export interface User {
  /** Identificador único del usuario */
  idUsuario: number;

  /** Identificador del rol asignado */
  idRol: number;

  /** Nombre legible del rol */
  rol?: UserRoleName;

  /** Nombre completo del usuario */
  nombre: string;

  /** Correo electrónico institucional o personal */
  correo: string;

  /** Cédula o documento de identificación */
  identificacion: string;

  /** Indica si la cuenta se encuentra habilitada para operar */
  activo: boolean;
}

