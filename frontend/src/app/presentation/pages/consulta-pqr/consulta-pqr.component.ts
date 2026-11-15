import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/application/auth';
import { GetPqrByCodigoUseCase } from '../../../core/application/usecases/get-pqr-by-codigo.usecase';
import { GetPqrHistorialUseCase } from '../../../core/application/usecases/get-pqr-historial.usecase';
import { GetPqrAttachmentsUseCase } from '../../../core/application/usecases/get-pqr-attachments.usecase';
import { DownloadPqrAttachmentUseCase } from '../../../core/application/usecases/download-pqr-attachment.usecase';
import { PqrAttachment } from '../../../core/domain/models/pqr-attachment.model';
import {
  AttachmentPreviewModalComponent,
  AttachmentsListComponent,
  BadgeEstadoComponent,
  BadgeTipoComponent,
  EmptyStateComponent,
  LoadingSpinnerComponent,
} from '../../components/shared';
import { VmConsultaPqr } from '../../interfaces/vm-consulta-pqr.interface';

/**
 * Página de consulta de estado y trazabilidad de una PQR por su código único.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-consulta-pqr',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    BadgeEstadoComponent,
    BadgeTipoComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    AttachmentsListComponent,
    AttachmentPreviewModalComponent,
  ],
  templateUrl: './consulta-pqr.component.html',
  styleUrl: './consulta-pqr.component.scss',
})
export class ConsultaPqrComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private getPqrByCodigoUseCase = inject(GetPqrByCodigoUseCase);
  private getPqrHistorialUseCase = inject(GetPqrHistorialUseCase);
  private getPqrAttachmentsUseCase = inject(GetPqrAttachmentsUseCase);
  private downloadPqrAttachmentUseCase = inject(DownloadPqrAttachmentUseCase);
  authService = inject(AuthService);

  codigoControl = new FormControl('', [Validators.required, Validators.minLength(5)]);

  previewAttachment = signal<PqrAttachment | null>(null);
  previewBlobUrl = signal<string | null>(null);

  state = signal<VmConsultaPqr>({
    loading: false,
    searched: false,
    pqr: null,
    history: [],
    attachments: [],
    loadingAttachments: false,
    error: null,
  });

  ngOnInit(): void {
    const codeParam = this.route.snapshot.queryParamMap.get('codigo');
    if (codeParam) {
      this.codigoControl.setValue(codeParam);
      this.searchPqr(codeParam);
    }
  }

  ngOnDestroy(): void {
    this.revokeActiveBlob();
  }

  onSearch(): void {
    const code = this.codigoControl.value?.trim();
    if (!code) return;
    this.searchPqr(code);
  }

  private searchPqr(codigo: string): void {
    this.revokeActiveBlob();
    this.state.set({
      loading: true,
      searched: true,
      pqr: null,
      history: [],
      attachments: [],
      loadingAttachments: false,
      error: null,
    });

    this.getPqrByCodigoUseCase.execute(codigo).subscribe({
      next: (pqr) => {
        // Carga en paralelo del historial y de los documentos adjuntos
        this.state.update((s) => ({
          ...s,
          loading: false,
          pqr,
          loadingAttachments: true,
        }));

        this.loadHistory(pqr.idPqr);
        this.loadAttachments(pqr.idPqr, codigo);
      },
      error: (err) => {
        this.state.set({
          loading: false,
          searched: true,
          pqr: null,
          history: [],
          attachments: [],
          loadingAttachments: false,
          error:
            err.message ||
            `No se encontró ninguna solicitud registrada con el código "${codigo}".`,
        });
      },
    });
  }

  private loadHistory(idPqr: number): void {
    this.getPqrHistorialUseCase.execute(idPqr).subscribe({
      next: (history) => {
        this.state.update((s) => ({ ...s, history }));
      },
      error: () => {
        this.state.update((s) => ({ ...s, history: [] }));
      },
    });
  }

  private loadAttachments(idPqr: number, codigoSeguimiento: string): void {
    this.getPqrAttachmentsUseCase.execute(idPqr, codigoSeguimiento).subscribe({
      next: (attachments) => {
        this.state.update((s) => ({
          ...s,
          attachments,
          loadingAttachments: false,
        }));
      },
      error: () => {
        this.state.update((s) => ({
          ...s,
          attachments: [],
          loadingAttachments: false,
        }));
      },
    });
  }

  onPreview(att: PqrAttachment): void {
    this.revokeActiveBlob();
    this.previewAttachment.set(att);

    const codigo = this.codigoControl.value?.trim() || undefined;
    this.downloadPqrAttachmentUseCase.execute(att.idAdjunto, codigo).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.previewBlobUrl.set(url);
      },
      error: () => {
        alert('No fue posible previsualizar el documento.');
        this.onClosePreview();
      },
    });
  }

  onDownload(att: PqrAttachment): void {
    const codigo = this.codigoControl.value?.trim() || undefined;
    this.downloadPqrAttachmentUseCase.execute(att.idAdjunto, codigo).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = att.nombreOriginal;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => {
        alert(`Error al descargar el archivo "${att.nombreOriginal}".`);
      },
    });
  }

  onClosePreview(): void {
    this.revokeActiveBlob();
    this.previewAttachment.set(null);
  }

  private revokeActiveBlob(): void {
    const current = this.previewBlobUrl();
    if (current) {
      URL.revokeObjectURL(current);
      this.previewBlobUrl.set(null);
    }
  }
}
