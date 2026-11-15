import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/application/auth';
import { CreatePqrUseCase } from '../../../core/application/usecases/create-pqr.usecase';
import { GetAllCategoriesUseCase } from '../../../core/application/usecases/get-all-categories.usecase';
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
  private getAllCategoriesUseCase = inject(GetAllCategoriesUseCase);
  private uploadPqrAttachmentsUseCase = inject(UploadPqrAttachmentsUseCase);
  authService = inject(AuthService);
  private router = inject(Router);

  tiposPqr: PqrType[] = ['Peticion', 'Queja', 'Reclamo', 'Sugerencia'];
  selectedFiles = signal<File[]>([]);

  state = signal<VmRegistroPqr>({
    loadingCategories: true,
    submitting: false,
    categories: [],
    createdPqr: null,
    error: null,
    attachedFilesCount: 0,
  });

  form = new FormGroup({
    tipoPqr: new FormControl<PqrType>('Peticion', [Validators.required]),
    idCategoria: new FormControl<number | null>(null, [Validators.required]),
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
  });

  ngOnInit(): void {
    this.loadCategories();
    this.prefillUserIfAuthenticated();
  }

  private prefillUserIfAuthenticated(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.form.patchValue({
        nombreSolicitante: user.nombre,
        correoSolicitante: user.correo,
        identificacionSolicitante: user.identificacion,
      });
    }
  }

  private loadCategories(): void {
    this.getAllCategoriesUseCase.execute().subscribe({
      next: (categories) => {
        this.state.update((s) => ({
          ...s,
          loadingCategories: false,
          categories,
        }));
        if (categories.length > 0) {
          this.form.patchValue({ idCategoria: categories[0].idCategoria });
        }
      },
      error: () => {
        this.state.update((s) => ({
          ...s,
          loadingCategories: false,
          error: 'Error al cargar las categorías del sistema.',
        }));
      },
    });
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
      idCategoria: Number(raw.idCategoria),
      asunto: raw.asunto!.trim(),
      descripcion: raw.descripcion!.trim(),
      nombreSolicitante: raw.nombreSolicitante!.trim(),
      correoSolicitante: raw.correoSolicitante!.trim(),
      identificacionSolicitante: raw.identificacionSolicitante!.trim(),
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
      idCategoria: this.state().categories[0]?.idCategoria ?? null,
    });
    this.prefillUserIfAuthenticated();
  }

  goToConsulta(codigo: string): void {
    this.router.navigate(['/consulta'], { queryParams: { codigo } });
  }
}
