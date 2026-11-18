import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/application/auth';
import { GetUserByIdUseCase } from '../../../core/application/usecases/get-user-by-id.usecase';
import { UpdateUserUseCase } from '../../../core/application/usecases/update-user.usecase';
import { LoadingSpinnerComponent } from '../../components/shared';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  authService = inject(AuthService);
  private getUserByIdUseCase = inject(GetUserByIdUseCase);
  private updateUserUseCase = inject(UpdateUserUseCase);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  feedback = signal<string | null>(null);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
    correo: new FormControl('', [Validators.required, Validators.email]),
    identificacion: new FormControl('', [Validators.required, Validators.minLength(5)]),
    telefono: new FormControl(''),
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.form.patchValue({
      nombre: user.nombre,
      correo: user.correo,
      identificacion: user.identificacion,
      telefono: user.telefono ?? '',
    });

    this.getUserByIdUseCase.execute(user.idUsuario).subscribe({
      next: (fresh) => {
        this.authService.updateCurrentUser(fresh);
        this.form.patchValue({
          nombre: fresh.nombre,
          correo: fresh.correo,
          identificacion: fresh.identificacion,
          telefono: fresh.telefono ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  saveProfile(): void {
    const user = this.authService.currentUser();
    if (!user || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.feedback.set(null);

    this.updateUserUseCase
      .execute(user.idUsuario, {
        nombre: val.nombre!.trim(),
        correo: val.correo!.trim(),
        identificacion: val.identificacion!.trim(),
        telefono: val.telefono?.trim() || null,
      })
      .subscribe({
        next: (updated) => {
          this.authService.updateCurrentUser(updated);
          this.feedback.set('Perfil actualizado correctamente.');
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.error || err.message || 'No fue posible actualizar tu perfil.');
          this.saving.set(false);
        },
      });
  }
}
