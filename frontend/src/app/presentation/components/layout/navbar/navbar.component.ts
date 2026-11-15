import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/application/auth';

/**
 * Componente de navegación principal y barra superior del sistema.
 *
 * @description
 * Provee la barra de navegación adaptativa según el estado de sesión
 * y el rol activo del usuario (Público, Solicitante, SIAU, Responsable, Directivo).
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
