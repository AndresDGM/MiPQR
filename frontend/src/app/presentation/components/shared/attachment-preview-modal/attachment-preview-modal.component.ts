import {
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  formatBytes,
  getAttachmentCategory,
  PqrAttachment,
} from '../../../../core/domain/models/pqr-attachment.model';

/**
 * Modal accesible para previsualización in-situ de documentos PDF e imágenes.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-attachment-preview-modal',
  standalone: true,
  templateUrl: './attachment-preview-modal.component.html',
  styleUrl: './attachment-preview-modal.component.scss',
})
export class AttachmentPreviewModalComponent {
  private sanitizer = inject(DomSanitizer);

  attachment = input<PqrAttachment | null>(null);
  blobUrl = input<string | null>(null);

  closeModal = output<void>();
  downloadFile = output<PqrAttachment>();

  category = computed(() => {
    const att = this.attachment();
    return att ? getAttachmentCategory(att.extension) : 'other';
  });

  safeBlobUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.blobUrl();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  formatSize(bytes?: number): string {
    return bytes ? formatBytes(bytes) : '';
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal.emit();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal.emit();
    }
  }
}
