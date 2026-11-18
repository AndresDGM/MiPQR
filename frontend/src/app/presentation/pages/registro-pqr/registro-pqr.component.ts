import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/application/auth';
import { CreatePqrUseCase } from '../../../core/application/usecases/create-pqr.usecase';
import { UploadPqrAttachmentsUseCase } from '../../../core/application/usecases/upload-pqr-attachments.usecase';
import { CreatePqrPayload, PqrType } from '../../../core/domain/models/pqr.model';
import {
  BadgeTipoComponent,
  FileUploadComponent,
  LoadingSpinnerComponent,
} from '../../components/shared';
import { VmRegistroPqr } from '../../interfaces/vm-registro-pqr.interface';

/**
 * Página para el registro y radicación de nuevas solicitudes PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-registro-pqr',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LoadingSpinnerComponent,
    BadgeTipoComponent,
    FileUploadComponent,
  ],
  templateUrl: './registro-pqr.component.html',
  styleUrl: './registro-pqr.component.scss',
})
export class RegistroPqrComponent implements OnInit {
  private createPqrUseCase = inject(CreatePqrUseCase);
  private uploadPqrAttachmentsUseCase = inject(UploadPqrAttachmentsUseCase);
  authService = inject(AuthService);
  private router = inject(Router);

  tiposPqr: PqrType[] = ['Peticion', 'Queja', 'Reclamo', 'Sugerencia'];
  selectedFiles = signal<File[]>([]);
  copied = signal(false);

  copyCodigo(codigo?: string): void {
    if (!codigo) return;
    navigator.clipboard?.writeText(codigo);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  state = signal<VmRegistroPqr>({
    loadingCategories: false,
    submitting: false,
    categories: [],
    createdPqr: null,
    error: null,
    attachedFilesCount: 0,
  });

  form = new FormGroup({
    tipoPqr: new FormControl<PqrType>('Peticion', [Validators.required]),
    asunto: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(150),
    ]),
    descripcion: new FormControl('', [Validators.required, Validators.minLength(15)]),
    nombreSolicitante: new FormControl('', [Validators.required, Validators.minLength(3)]),
    correoSolicitante: new FormControl('', [Validators.required, Validators.email]),
    identificacionSolicitante: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    telefonoSolicitante: new FormControl(''),
  });

  ngOnInit(): void {
    this.prefillUserIfAuthenticated();
  }

  private prefillUserIfAuthenticated(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.form.patchValue({
        nombreSolicitante: user.nombre,
        correoSolicitante: user.correo,
        identificacionSolicitante: user.identificacion,
        telefonoSolicitante: user.telefono ?? '',
      });
    }
  }

  onFilesSelected(files: File[]): void {
    this.selectedFiles.set(files);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.update((s) => ({ ...s, submitting: true, error: null }));
    const raw = this.form.getRawValue();

    const payload: CreatePqrPayload = {
      tipoPqr: raw.tipoPqr!,
      asunto: raw.asunto!.trim(),
      descripcion: raw.descripcion!.trim(),
      nombreSolicitante: raw.nombreSolicitante!.trim(),
      correoSolicitante: raw.correoSolicitante!.trim(),
      identificacionSolicitante: raw.identificacionSolicitante!.trim(),
      telefonoSolicitante: raw.telefonoSolicitante?.trim() || null,
    };

    this.createPqrUseCase.execute(payload).subscribe({
      next: (pqr) => {
        const filesToUpload = this.selectedFiles();
        if (filesToUpload.length > 0) {
          // Si el usuario adjuntó archivos, subirlos vinculados a la PQR creada
          this.uploadPqrAttachmentsUseCase.execute(pqr.idPqr, filesToUpload).subscribe({
            next: (attachments) => {
              this.state.update((s) => ({
                ...s,
                submitting: false,
                createdPqr: pqr,
                attachedFilesCount: attachments.length,
              }));
              this.selectedFiles.set([]);
            },
            error: (err) => {
              // La PQR se radicó con éxito pero hubo advertencia en los adjuntos
              this.state.update((s) => ({
                ...s,
                submitting: false,
                createdPqr: pqr,
                attachedFilesCount: 0,
                error: `La PQR se radicó exitosamente, pero ocurrió un inconveniente al cargar los soportes: ${err.message || 'Error en carga de archivos'}. Puede aportarlos posteriormente con el analista.`,
              }));
              this.selectedFiles.set([]);
            },
          });
        } else {
          this.state.update((s) => ({
            ...s,
            submitting: false,
            createdPqr: pqr,
            attachedFilesCount: 0,
          }));
        }
      },
      error: (err) => {
        this.state.update((s) => ({
          ...s,
          submitting: false,
          error: err.message || 'Error al radicar la solicitud.',
        }));
      },
    });
  }

  resetForm(): void {
    this.selectedFiles.set([]);
    this.state.update((s) => ({ ...s, createdPqr: null, error: null, attachedFilesCount: 0 }));
    this.form.reset({
      tipoPqr: 'Peticion',
    });
    this.prefillUserIfAuthenticated();
  }

  goToConsulta(codigo: string): void {
    this.router.navigate(['/consulta'], { queryParams: { codigo } });
  }
}
