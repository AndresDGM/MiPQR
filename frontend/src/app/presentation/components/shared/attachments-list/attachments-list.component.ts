import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import {
  formatBytes,
  getAttachmentCategory,
  PqrAttachment,
} from '../../../../core/domain/models/pqr-attachment.model';

/**
 * Componente reutilizable para listado y gestión de documentos adjuntos a una PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-attachments-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './attachments-list.component.html',
  styleUrl: './attachments-list.component.scss',
})
export class AttachmentsListComponent {
  attachments = input<PqrAttachment[]>([]);
  canDelete = input<boolean>(false);
  loading = input<boolean>(false);
  emptyMessage = input<string>(
    'No se han adjuntado documentos de soporte para esta solicitud.'
  );

  preview = output<PqrAttachment>();
  download = output<PqrAttachment>();
  delete = output<PqrAttachment>();

  getCategory(ext: string): string {
    return getAttachmentCategory(ext);
  }

  isPrevisualizable(ext: string): boolean {
    const cat = getAttachmentCategory(ext);
    return cat === 'pdf' || cat === 'image';
  }

  formatSize(bytes: number): string {
    return formatBytes(bytes);
  }
}
