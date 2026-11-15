import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pqr } from '../../../../core/domain/models/pqr.model';
import { BadgeEstadoComponent } from '../badge-estado/badge-estado.component';
import { BadgeTipoComponent } from '../badge-tipo/badge-tipo.component';

/**
 * Tarjeta de visualización resumida para una solicitud PQR.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-pqr-card',
  standalone: true,
  imports: [DatePipe, RouterLink, BadgeEstadoComponent, BadgeTipoComponent],
  templateUrl: './pqr-card.component.html',
  styleUrl: './pqr-card.component.scss',
})
export class PqrCardComponent {
  pqr = input.required<Pqr>();
}
