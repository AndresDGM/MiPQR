import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/application/auth';
import { LoadingSpinnerComponent } from '../../components/shared';
import { VmLogin } from '../../interfaces/vm-auth.interface';

/**
 * Página de inicio de sesión para funcionarios y usuarios registrados.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  state = signal<VmLogin>({
    loading: false,
    error: null,
  });

  form = new FormGroup({
    correo: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set({ loading: true, error: null });
    const { correo, password } = this.form.getRawValue();

    this.authService.login(correo!, password!).subscribe({
      next: (user) => {
        this.state.set({ loading: false, error: null });
        if (user.rol === 'Solicitante') {
          this.router.navigate(['/registro-pqr']);
        } else {
          this.router.navigate(['/bandeja']);
        }
      },
      error: (err) => {
        this.state.set({
          loading: false,
          error: err.message || 'Error al iniciar sesión',
        });
      },
    });
  }
}
