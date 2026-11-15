/**
 * Interfaz que representa una categoría de clasificación para las PQR.
 *
 * @description
 * Permite clasificar las solicitudes según el área o tipo de servicio
 * (ej: Facturación, Consulta Externa, Farmacia, Urgencias, Trámites Administrativos).
 *
 * @example
 * ```ts
 * const categoria: Category = {
 *   idCategoria: 1,
 *   nombre: 'Atención Médica',
 *   descripcion: 'PQR relacionadas con tiempos de espera y consultas médicas.',
 *   activa: true
 * };
 * ```
 */
export interface Category {
  /** Identificador único de la categoría */
  idCategoria: number;

  /** Nombre de la categoría */
  nombre: string;

  /** Descripción del alcance de la categoría */
  descripcion: string;

  /** Indica si la categoría está disponible para nuevas solicitudes */
  activa: boolean;
}

