import { Component, computed, input } from '@angular/core';
import { PqrType } from '../../../../core/domain/models/pqr.model';

/**
 * Componente visual para representar el tipo de solicitud PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-badge-tipo',
  standalone: true,
  template: `
    <span class="badge-tipo" [class]="cssClass()">
      {{ tipo() }}
    </span>
  `,
  styleUrl: './badge-tipo.component.scss',
})
export class BadgeTipoComponent {
  tipo = input.required<PqrType>();

  cssClass = computed(() => {
    switch (this.tipo()) {
      case 'Peticion':
        return 'badge-tipo--peticion';
      case 'Queja':
        return 'badge-tipo--queja';
      case 'Reclamo':
        return 'badge-tipo--reclamo';
      case 'Sugerencia':
        return 'badge-tipo--sugerencia';
      default:
        return '';
    }
  });
}
