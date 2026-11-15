import { Category } from '../../core/domain/models/category.model';
import { Pqr, PqrStatusName, PqrType } from '../../core/domain/models/pqr.model';

/**
 * ViewModel para la bandeja de gestión de PQR (SIAU / Responsables / Directivos).
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
export interface VmBandeja {
  loading: boolean;
  pqrs: Pqr[];
  categories: Category[];
  error: string | null;
}

export interface PqrStats {
  total: number;
  recibidas: number;
  enRevision: number;
  asignadas: number;
  enGestion: number;
  respondidas: number;
  cerradas: number;
}
