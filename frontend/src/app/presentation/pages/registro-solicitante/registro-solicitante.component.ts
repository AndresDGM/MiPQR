import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/application/auth';
import { LoadingSpinnerComponent } from '../../components/shared';
import { VmRegistroSolicitante } from '../../interfaces/vm-auth.interface';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
};

/**
 * Página para el auto-registro de nuevos solicitantes (pacientes/usuarios).
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-registro-solicitante',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './registro-solicitante.component.html',
  styleUrl: './registro-solicitante.component.scss',
})
export class RegistroSolicitanteComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  state = signal<VmRegistroSolicitante>({
    loading: false,
    error: null,
    success: false,
  });

  form = new FormGroup(
    {
      nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
      identificacion: new FormControl('', [Validators.required, Validators.minLength(6)]),
      correo: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(4)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordsMatchValidator }
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set({ loading: true, error: null, success: false });
    const { nombre, correo, identificacion, password } = this.form.getRawValue();

    this.authService
      .registerSolicitante({
        nombre: nombre!,
        correo: correo!,
        identificacion: identificacion!,
        password: password!,
      })
      .subscribe({
        next: () => {
          this.state.set({ loading: false, error: null, success: true });
          setTimeout(() => {
            this.router.navigate(['/registro-pqr']);
          }, 1200);
        },
        error: (err) => {
          this.state.set({
            loading: false,
            error: err.message || 'Error al registrar la cuenta.',
            success: false,
          });
        },
      });
  }
}
