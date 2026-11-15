import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Página 404 para rutas no existentes en la aplicación.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
