import { Component, computed, input } from '@angular/core';
import { PqrStatusName } from '../../../../core/domain/models/pqr.model';

/**
 * Componente visual para representar el estado del ciclo de vida de una PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-badge-estado',
  standalone: true,
  template: `
    <span class="badge-estado" [class]="cssClass()">
      <span class="badge-estado__dot"></span>
      {{ estado() }}
    </span>
  `,
  styleUrl: './badge-estado.component.scss',
})
export class BadgeEstadoComponent {
  estado = input.required<PqrStatusName>();

  cssClass = computed(() => {
    switch (this.estado()) {
      case 'Recibida':
        return 'badge-estado--recibida';
      case 'En revision':
        return 'badge-estado--revision';
      case 'Asignada':
        return 'badge-estado--asignada';
      case 'En gestion':
        return 'badge-estado--gestion';
      case 'Respondida':
        return 'badge-estado--respondida';
      case 'Cerrada':
        return 'badge-estado--cerrada';
      default:
        return '';
    }
  });
}
