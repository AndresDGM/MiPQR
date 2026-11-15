import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pqr } from '../../../../core/domain/models/pqr.model';
import { BadgeEstadoComponent } from '../../shared/badge-estado/badge-estado.component';
import { BadgeTipoComponent } from '../../shared/badge-tipo/badge-tipo.component';

/**
 * Tabla interactiva para la visualización y gestión del listado de solicitudes PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-pqr-table',
  standalone: true,
  imports: [DatePipe, RouterLink, BadgeEstadoComponent, BadgeTipoComponent],
  templateUrl: './pqr-table.component.html',
  styleUrl: './pqr-table.component.scss',
})
export class PqrTableComponent {
  pqrs = input.required<Pqr[]>();
}
