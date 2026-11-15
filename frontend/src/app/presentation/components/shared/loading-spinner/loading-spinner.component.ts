import { Component, input } from '@angular/core';

/**
 * Componente visual reutilizable para estados de carga.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="loading-wrapper">
      <div class="spinner" role="status" aria-label="Cargando..."></div>
      @if (mensaje()) {
        <p class="loading-text">{{ mensaje() }}</p>
      }
    </div>
  `,
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  mensaje = input<string>('Cargando información...');
}
