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
