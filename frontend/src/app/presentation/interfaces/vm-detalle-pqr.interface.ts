import { PqrAttachment } from '../../core/domain/models/pqr-attachment.model';
import { PqrHistory } from '../../core/domain/models/pqr-history.model';
import { Pqr } from '../../core/domain/models/pqr.model';
import { User } from '../../core/domain/models/user.model';

/**
 * ViewModel para la página de detalle, trazabilidad y gestión administrativa de una PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
export interface VmDetallePqr {
  loading: boolean;
  actionLoading: boolean;
  pqr: Pqr | null;
  history: PqrHistory[];
  attachments?: PqrAttachment[];
  loadingAttachments?: boolean;
  responsables: User[];
  successMessage: string | null;
  error: string | null;
}
