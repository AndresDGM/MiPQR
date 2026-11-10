import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/application/auth';
import { AssignPqrResponsableUseCase } from '../../../core/application/usecases/assign-pqr-responsable.usecase';
import { GetPqrByIdUseCase } from '../../../core/application/usecases/get-pqr-by-id.usecase';
import { GetPqrHistorialUseCase } from '../../../core/application/usecases/get-pqr-historial.usecase';
import { GetUsersByRolUseCase } from '../../../core/application/usecases/get-users-by-rol.usecase';
import { ResponderPqrUseCase } from '../../../core/application/usecases/responder-pqr.usecase';
import { UpdatePqrEstadoUseCase } from '../../../core/application/usecases/update-pqr-estado.usecase';
import { GetPqrAttachmentsUseCase } from '../../../core/application/usecases/get-pqr-attachments.usecase';
import { DownloadPqrAttachmentUseCase } from '../../../core/application/usecases/download-pqr-attachment.usecase';
import { DeletePqrAttachmentUseCase } from '../../../core/application/usecases/delete-pqr-attachment.usecase';
import { UploadPqrAttachmentsUseCase } from '../../../core/application/usecases/upload-pqr-attachments.usecase';
import { Pqr, PqrStatusName } from '../../../core/domain/models/pqr.model';
import { PqrAttachment } from '../../../core/domain/models/pqr-attachment.model';
import {
  AttachmentPreviewModalComponent,
  AttachmentsListComponent,
  BadgeEstadoComponent,
  BadgeTipoComponent,
  FileUploadComponent,
  LoadingSpinnerComponent,
} from '../../components/shared';
import { VmDetallePqr } from '../../interfaces/vm-detalle-pqr.interface';

/**
 * Página de detalle exhaustivo, trazabilidad cronológica y gestión de actuaciones de una PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-detalle-pqr',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    BadgeEstadoComponent,
    BadgeTipoComponent,
    LoadingSpinnerComponent,
    AttachmentsListComponent,
    AttachmentPreviewModalComponent,
    FileUploadComponent,
  ],
  templateUrl: './detalle-pqr.component.html',
  styleUrl: './detalle-pqr.component.scss',
})
export class DetallePqrComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private getPqrByIdUseCase = inject(GetPqrByIdUseCase);
  private getPqrHistorialUseCase = inject(GetPqrHistorialUseCase);
  private getUsersByRolUseCase = inject(GetUsersByRolUseCase);
  private updatePqrEstadoUseCase = inject(UpdatePqrEstadoUseCase);
  private assignPqrResponsableUseCase = inject(AssignPqrResponsableUseCase);
  private responderPqrUseCase = inject(ResponderPqrUseCase);
  private getPqrAttachmentsUseCase = inject(GetPqrAttachmentsUseCase);
  private downloadPqrAttachmentUseCase = inject(DownloadPqrAttachmentUseCase);
  private deletePqrAttachmentUseCase = inject(DeletePqrAttachmentUseCase);
  private uploadPqrAttachmentsUseCase = inject(UploadPqrAttachmentsUseCase);
  authService = inject(AuthService);

  idPqr!: number;

  /** El analista SIAU clasifica y asigna los casos */
  puedeAsignar = computed(() => this.authService.userRol() === 'Analista SIAU');

  /** Analista y responsable pueden actualizar el estado del caso */
  puedeActualizarEstado = computed(() => {
    const rol = this.authService.userRol();
    return rol === 'Analista SIAU' || rol === 'Responsable';
  });

  /** Solo el responsable emite la respuesta oficial */
  puedeResponder = computed(() => this.authService.userRol() === 'Responsable');

  /** El directivo consulta sin modificar */
  soloLectura = computed(() => this.authService.userRol() === 'Directivo');

  /** Analista SIAU puede retirar adjuntos erróneos */
  puedeEliminarAdjunto = computed(() => this.authService.userRol() === 'Analista SIAU');

  /** Analista o Responsable pueden anexar documentos adicionales a la PQR */
  puedeAdjuntarSoporte = computed(() => {
    const rol = this.authService.userRol();
    return rol === 'Analista SIAU' || rol === 'Responsable';
  });

  estadosDisponibles: PqrStatusName[] = [
    'Recibida',
    'En revision',
    'Asignada',
    'En gestion',
    'Respondida',
    'Cerrada',
  ];

  previewAttachment = signal<PqrAttachment | null>(null);
  previewBlobUrl = signal<string | null>(null);
  showAttachSection = signal<boolean>(false);
  filesToAttach = signal<File[]>([]);

  state = signal<VmDetallePqr>({
    loading: true,
    actionLoading: false,
    pqr: null,
    history: [],
    attachments: [],
    loadingAttachments: false,
    responsables: [],
    successMessage: null,
    error: null,
  });

  estadoForm = new FormGroup({
    nuevoEstado: new FormControl<PqrStatusName>('En revision', [Validators.required]),
    observacion: new FormControl('', [Validators.required, Validators.minLength(5)]),
  });

  responsableForm = new FormGroup({
    idResponsable: new FormControl<number | null>(null, [Validators.required]),
  });

  respuestaForm = new FormGroup({
    contenido: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.idPqr = Number(idParam);

    if (!this.idPqr) {
      this.state.update((s) => ({
        ...s,
        loading: false,
        error: 'Identificador de PQR inválido.',
      }));
      return;
    }

    this.loadDetails();

    // Solo quien puede asignar necesita (y puede consultar) la lista de responsables
    if (this.puedeAsignar()) {
      this.loadResponsables();
    }
  }

  ngOnDestroy(): void {
    this.revokeActiveBlob();
  }

  loadDetails(): void {
    this.getPqrByIdUseCase.execute(this.idPqr).subscribe({
      next: (pqr) => {
        if (this.esCasoDeOtroResponsable(pqr)) {
          this.router.navigateByUrl('/bandeja');
          return;
        }

        this.state.update((s) => ({ ...s, pqr, loading: false }));
        this.estadoForm.patchValue({ nuevoEstado: pqr.estado });
        this.loadHistory();
        this.loadAttachments();
      },
      error: (err) => {
        this.state.update((s) => ({
          ...s,
          loading: false,
          error: err.message || 'No fue posible cargar el detalle de la solicitud.',
        }));
      },
    });
  }

  loadAttachments(): void {
    this.state.update((s) => ({ ...s, loadingAttachments: true }));
    this.getPqrAttachmentsUseCase.execute(this.idPqr).subscribe({
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

    this.downloadPqrAttachmentUseCase.execute(att.idAdjunto).subscribe({
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
    this.downloadPqrAttachmentUseCase.execute(att.idAdjunto).subscribe({
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

  onDeleteAttachment(att: PqrAttachment): void {
    if (!confirm(`¿Está seguro de que desea eliminar el documento "${att.nombreOriginal}"?`)) {
      return;
    }

    this.state.update((s) => ({ ...s, actionLoading: true, successMessage: null, error: null }));
    this.deletePqrAttachmentUseCase.execute(att.idAdjunto).subscribe({
      next: () => {
        this.state.update((s) => ({
          ...s,
          actionLoading: false,
          successMessage: `Documento "${att.nombreOriginal}" eliminado correctamente.`,
        }));
        this.loadAttachments();
        this.loadHistory();
      },
      error: (err) => {
        this.state.update((s) => ({
          ...s,
          actionLoading: false,
          error: err.message || 'Error al eliminar el documento adjunto.',
        }));
      },
    });
  }

  onFilesToAttachSelected(files: File[]): void {
    this.filesToAttach.set(files);
  }

  onSubmitAttachMore(): void {
    const files = this.filesToAttach();
    if (files.length === 0) return;

    this.state.update((s) => ({ ...s, actionLoading: true, successMessage: null, error: null }));
    this.uploadPqrAttachmentsUseCase.execute(this.idPqr, files).subscribe({
      next: (uploaded) => {
        this.state.update((s) => ({
          ...s,
          actionLoading: false,
          successMessage: `Se anexaron ${uploaded.length} documento(s) de soporte con éxito.`,
        }));
        this.filesToAttach.set([]);
        this.showAttachSection.set(false);
        this.loadAttachments();
        this.loadHistory();
      },
      error: (err) => {
        this.state.update((s) => ({
          ...s,
          actionLoading: false,
          error: err.message || 'Error al cargar los documentos de soporte.',
        }));
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

  /** Un Responsable solo puede abrir los casos que tiene asignados */
  private esCasoDeOtroResponsable(pqr: Pqr): boolean {
    const usuario = this.authService.currentUser();
    return this.authService.userRol() === 'Responsable' && pqr.idResponsable !== usuario?.idUsuario;
  }

  loadHistory(): void {
    this.getPqrHistorialUseCase.execute(this.idPqr).subscribe({
      next: (history) => {
        this.state.update((s) => ({ ...s, history }));
      },
    });
  }

  loadResponsables(): void {
    this.getUsersByRolUseCase.execute('Responsable').subscribe({
      next: (responsables) => {
        this.state.update((s) => ({ ...s, responsables }));
        if (responsables.length > 0) {
          this.responsableForm.patchValue({ idResponsable: responsables[0].idUsuario });
        }
      },
    });
  }

  onCambiarEstado(): void {
    if (this.estadoForm.invalid) return;

    this.state.update((s) => ({
      ...s,
      actionLoading: true,
      successMessage: null,
      error: null,
    }));
    const { nuevoEstado, observacion } = this.estadoForm.getRawValue();

    this.updatePqrEstadoUseCase
      .execute(this.idPqr, nuevoEstado!, observacion!)
      .subscribe({
        next: (updated) => {
          this.state.update((s) => ({
            ...s,
            actionLoading: false,
            pqr: updated,
            successMessage: `Estado actualizado a "${nuevoEstado}" con éxito.`,
          }));
          this.estadoForm.patchValue({ observacion: '' });
          this.loadHistory();
        },
        error: (err) => {
          this.state.update((s) => ({
            ...s,
            actionLoading: false,
            error: err.message || 'Error al actualizar el estado.',
          }));
        },
      });
  }

  onAsignarResponsable(): void {
    if (this.responsableForm.invalid) return;

    this.state.update((s) => ({
      ...s,
      actionLoading: true,
      successMessage: null,
      error: null,
    }));
    const idResp = Number(this.responsableForm.getRawValue().idResponsable);

    this.assignPqrResponsableUseCase.execute(this.idPqr, idResp).subscribe({
      next: (updated) => {
        this.state.update((s) => ({
          ...s,
          actionLoading: false,
          pqr: updated,
          successMessage: `Responsable "${updated.nombreResponsable}" asignado con éxito.`,
        }));
        this.loadHistory();
      },
      error: (err) => {
        this.state.update((s) => ({
          ...s,
          actionLoading: false,
          error: err.message || 'Error al asignar responsable.',
        }));
      },
    });
  }

  onResponder(): void {
    if (this.respuestaForm.invalid) return;

    this.state.update((s) => ({
      ...s,
      actionLoading: true,
      successMessage: null,
      error: null,
    }));
    const { contenido } = this.respuestaForm.getRawValue();

    this.responderPqrUseCase.execute(this.idPqr, contenido!).subscribe({
      next: () => {
        this.state.update((s) => ({
          ...s,
          actionLoading: false,
          successMessage:
            'Respuesta oficial radicada con éxito. La PQR ha pasado a estado "Respondida".',
        }));
        this.respuestaForm.reset();
        this.loadDetails();
      },
      error: (err) => {
        this.state.update((s) => ({
          ...s,
          actionLoading: false,
          error: err.message || 'Error al radicar la respuesta oficial.',
        }));
      },
    });
  }
}
