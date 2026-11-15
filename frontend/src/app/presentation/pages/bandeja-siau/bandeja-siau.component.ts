import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/application/auth';
import { GetAllCategoriesUseCase } from '../../../core/application/usecases/get-all-categories.usecase';
import { GetAllPqrsUseCase } from '../../../core/application/usecases/get-all-pqrs.usecase';
import { Pqr } from '../../../core/domain/models/pqr.model';
import { PqrTableComponent } from '../../components/pqr/pqr-table';
import { EmptyStateComponent, LoadingSpinnerComponent } from '../../components/shared';
import { PqrStats, VmBandeja } from '../../interfaces/vm-bandeja.interface';

/**
 * Página de bandeja de gestión centralizada de solicitudes PQR para personal SIAU y áreas.
 *
 * @architecture Clean Architecture
 * @layer Presentation
 */
@Component({
  selector: 'app-bandeja-siau',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PqrTableComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './bandeja-siau.component.html',
  styleUrl: './bandeja-siau.component.scss',
})
export class BandejaSiauComponent implements OnInit {
  private getAllPqrsUseCase = inject(GetAllPqrsUseCase);
  private getAllCategoriesUseCase = inject(GetAllCategoriesUseCase);
  authService = inject(AuthService);

  searchControl = new FormControl('');
  estadoFilterControl = new FormControl<string>('Todos');
  tipoFilterControl = new FormControl<string>('Todos');
  categoriaFilterControl = new FormControl<string>('Todas');

  state = signal<VmBandeja>({
    loading: true,
    pqrs: [],
    categories: [],
    error: null,
  });

  searchTerm = signal<string>('');
  estadoFilter = signal<string>('Todos');
  tipoFilter = signal<string>('Todos');
  categoriaFilter = signal<string>('Todas');

  stats = computed<PqrStats>(() => {
    const list = this.state().pqrs;
    return {
      total: list.length,
      recibidas: list.filter((p) => p.estado === 'Recibida').length,
      enRevision: list.filter((p) => p.estado === 'En revision').length,
      asignadas: list.filter((p) => p.estado === 'Asignada').length,
      enGestion: list.filter((p) => p.estado === 'En gestion').length,
      respondidas: list.filter((p) => p.estado === 'Respondida').length,
      cerradas: list.filter((p) => p.estado === 'Cerrada').length,
    };
  });

  filteredPqrs = computed<Pqr[]>(() => {
    let result = this.state().pqrs;

    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      result = result.filter(
        (p) =>
          p.codigoSeguimiento.toLowerCase().includes(term) ||
          p.asunto.toLowerCase().includes(term) ||
          (p.nombreSolicitante && p.nombreSolicitante.toLowerCase().includes(term)) ||
          (p.nombreResponsable && p.nombreResponsable.toLowerCase().includes(term))
      );
    }

    const estado = this.estadoFilter();
    if (estado !== 'Todos') {
      result = result.filter((p) => p.estado === estado);
    }

    const tipo = this.tipoFilter();
    if (tipo !== 'Todos') {
      result = result.filter((p) => p.tipoPqr === tipo);
    }

    const cat = this.categoriaFilter();
    if (cat !== 'Todas') {
      result = result.filter((p) => String(p.idCategoria) === cat);
    }

    return result;
  });

  ngOnInit(): void {
    this.setupFilterSubscriptions();
    this.loadData();
  }

  private setupFilterSubscriptions(): void {
    this.searchControl.valueChanges.subscribe((v) => this.searchTerm.set(v || ''));
    this.estadoFilterControl.valueChanges.subscribe((v) => this.estadoFilter.set(v || 'Todos'));
    this.tipoFilterControl.valueChanges.subscribe((v) => this.tipoFilter.set(v || 'Todos'));
    this.categoriaFilterControl.valueChanges.subscribe((v) =>
      this.categoriaFilter.set(v || 'Todas')
    );
  }

  loadData(): void {
    this.state.update((s) => ({ ...s, loading: true, error: null }));

    this.getAllCategoriesUseCase.execute().subscribe({
      next: (categories) => {
        this.state.update((s) => ({ ...s, categories }));
      },
    });

    this.getAllPqrsUseCase.execute().subscribe({
      next: (todas) => {
        // El responsable solo gestiona los casos que le fueron asignados
        const user = this.authService.currentUser();
        const pqrs =
          this.authService.userRol() === 'Responsable'
            ? todas.filter((p) => p.idResponsable === user?.idUsuario)
            : todas;

        this.state.update((s) => ({
          ...s,
          loading: false,
          pqrs,
        }));
      },
      error: (err) => {
        this.state.update((s) => ({
          ...s,
          loading: false,
          error: err.message || 'Error al cargar las solicitudes de la bandeja.',
        }));
      },
    });
  }

  setEstadoFilter(estado: string): void {
    this.estadoFilterControl.setValue(estado);
  }
}
