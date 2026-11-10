import { PqrAttachment } from '../../core/domain/models/pqr-attachment.model';
import { PqrHistory } from '../../core/domain/models/pqr-history.model';
import { Pqr } from '../../core/domain/models/pqr.model';

/**
 * ViewModel para la consulta pública de trazabilidad de una PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
export interface VmConsultaPqr {
  loading: boolean;
  searched: boolean;
  pqr: Pqr | null;
  history: PqrHistory[];
  attachments?: PqrAttachment[];
  loadingAttachments?: boolean;
  error: string | null;
}
