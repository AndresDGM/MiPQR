import {
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { formatBytes, getAttachmentCategory } from '../../../../core/domain/models/pqr-attachment.model';

export interface SelectedFileInfo {
  file: File;
  id: string;
  name: string;
  sizeFormatted: string;
  extension: string;
  category: 'pdf' | 'word' | 'image' | 'other';
}

/**
 * Componente reutilizable para selección, arrastre (Drag & Drop) y validación de documentos de soporte.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  multiple = input<boolean>(true);
  maxFiles = input<number>(5);
  maxSizeBytes = input<number>(10 * 1024 * 1024); // 10 MB individual
  maxTotalBytes = input<number>(25 * 1024 * 1024); // 25 MB total
  disabled = input<boolean>(false);

  filesChange = output<File[]>();

  isDragging = signal<boolean>(false);
  selectedFiles = signal<SelectedFileInfo[]>([]);
  errorMessage = signal<string | null>(null);

  readonly allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  readonly acceptAttr = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

  onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      this.handleFiles(Array.from(droppedFiles));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
      input.value = ''; // Reset input to allow re-selection
    }
  }

  triggerFileInput(): void {
    if (this.disabled()) return;
    this.fileInput()?.nativeElement.click();
  }

  removeFile(id: string): void {
    if (this.disabled()) return;
    const updated = this.selectedFiles().filter((f) => f.id !== id);
    this.selectedFiles.set(updated);
    this.errorMessage.set(null);
    this.filesChange.emit(updated.map((f) => f.file));
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
    this.errorMessage.set(null);
    this.filesChange.emit([]);
  }

  getTotalBytes(): number {
    return this.selectedFiles().reduce((acc, f) => acc + f.file.size, 0);
  }

  formatTotalBytes(): string {
    return formatBytes(this.getTotalBytes());
  }

  formatMaxBytes(): string {
    return formatBytes(this.maxTotalBytes());
  }

  private handleFiles(incoming: File[]): void {
    this.errorMessage.set(null);

    const currentFiles = this.selectedFiles();
    const effectiveLimit = this.multiple() ? this.maxFiles() : 1;

    if (currentFiles.length + incoming.length > effectiveLimit) {
      this.errorMessage.set(
        `Límite excedido: Solo se permite adjuntar hasta un máximo de ${effectiveLimit} archivos.`
      );
      return;
    }

    const newFiles: SelectedFileInfo[] = [];
    let accumulatedBytes = this.getTotalBytes();

    for (const file of incoming) {
      const ext = '.' + file.name.split('.').pop()!.toLowerCase();

      // Validación de extensión
      if (!this.allowedExtensions.includes(ext)) {
        this.errorMessage.set(
          `El archivo "${file.name}" no tiene un formato permitido. Formatos admitidos: PDF, Word (.doc, .docx) e imágenes (.jpg, .png).`
        );
        return;
      }

      // Validación de tamaño individual
      if (file.size > this.maxSizeBytes()) {
        const maxMb = (this.maxSizeBytes() / (1024 * 1024)).toFixed(1);
        this.errorMessage.set(
          `El archivo "${file.name}" supera el tamaño individual máximo de ${maxMb} MB.`
        );
        return;
      }

      // Validación de tamaño acumulado
      if (accumulatedBytes + file.size > this.maxTotalBytes()) {
        this.errorMessage.set(
          `El peso total de los archivos supera el límite permitido de ${this.formatMaxBytes()}.`
        );
        return;
      }

      // Evitar duplicados por nombre y tamaño
      const isDuplicate = currentFiles.some(
        (f) => f.name === file.name && f.file.size === file.size
      );
      if (isDuplicate) {
        continue;
      }

      accumulatedBytes += file.size;
      newFiles.push({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        extension: ext,
        category: getAttachmentCategory(ext),
      });
    }

    const merged = this.multiple() ? [...currentFiles, ...newFiles] : newFiles;
    this.selectedFiles.set(merged);
    this.filesChange.emit(merged.map((f) => f.file));
  }
}
