import { Component, input } from '@angular/core';

/**
 * Componente visual reutilizable para estados vacíos sin información.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <h3 class="empty-state__title">{{ titulo() }}</h3>
      @if (descripcion()) {
        <p class="empty-state__description">{{ descripcion() }}</p>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  titulo = input.required<string>();
  descripcion = input<string>();
}
