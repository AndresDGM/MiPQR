import { Category } from '../../core/domain/models/category.model';
import { Pqr } from '../../core/domain/models/pqr.model';

/**
 * ViewModel para el formulario y radicación de solicitudes PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
export interface VmRegistroPqr {
  loadingCategories: boolean;
  submitting: boolean;
  categories: Category[];
  createdPqr: Pqr | null;
  error: string | null;
  attachedFilesCount?: number;
}
