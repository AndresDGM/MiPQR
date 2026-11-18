import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/application/auth';
import { GetAllPqrsUseCase } from '../../../core/application/usecases/get-all-pqrs.usecase';
import { Pqr, PqrStatusName } from '../../../core/domain/models/pqr.model';
import {
  BadgeEstadoComponent,
  BadgeTipoComponent,
  EmptyStateComponent,
  LoadingSpinnerComponent,
} from '../../components/shared';

@Component({
  selector: 'app-mis-pqr',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    BadgeEstadoComponent,
    BadgeTipoComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './mis-pqr.component.html',
  styleUrl: './mis-pqr.component.scss',
})
export class MisPqrComponent implements OnInit {
  private getAllPqrsUseCase = inject(GetAllPqrsUseCase);
  private authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  pqrs = signal<Pqr[]>([]);
  searchTerm = signal('');
  estadoFilter = signal<PqrStatusName | ''>('');
  copiedCode = signal<string | null>(null);

  estados: PqrStatusName[] = [
    'Recibida',
    'En revision',
    'Asignada',
    'En gestion',
    'Respondida',
    'Cerrada',
  ];

  filteredPqrs = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const estado = this.estadoFilter();
    return this.pqrs().filter((p) => {
      const matchEstado = !estado || p.estado === estado;
      const matchTerm =
        !term ||
        p.codigoSeguimiento.toLowerCase().includes(term) ||
        p.asunto.toLowerCase().includes(term);
      return matchEstado && matchTerm;
    });
  });

  stats = computed(() => {
    const list = this.pqrs();
    const total = list.length;
    const finalizadas = list.filter((p) => p.estado === 'Respondida' || p.estado === 'Cerrada').length;
    return {
      total,
      enTramite: total - finalizadas,
      finalizadas,
    };
  });

  ngOnInit(): void {
    this.loadMisPqrs();
  }

  loadMisPqrs(): void {
    this.loading.set(true);
    this.error.set(null);
    const userId = this.authService.currentUser()?.idUsuario;
    this.getAllPqrsUseCase.execute().subscribe({
      next: (list) => {
        const propias = userId ? list.filter((p) => p.idSolicitante === userId) : list;
        this.pqrs.set(propias);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'No fue posible cargar tus solicitudes.');
        this.loading.set(false);
      },
    });
  }

  copyCodigo(codigo: string): void {
    navigator.clipboard?.writeText(codigo);
    this.copiedCode.set(codigo);
    setTimeout(() => {
      if (this.copiedCode() === codigo) {
        this.copiedCode.set(null);
      }
    }, 2000);
  }
}
