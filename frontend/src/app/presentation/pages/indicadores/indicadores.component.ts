import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GetAllPqrsUseCase } from '../../../core/application/usecases/get-all-pqrs.usecase';
import { Pqr } from '../../../core/domain/models/pqr.model';
import { BadgeEstadoComponent, BadgeTipoComponent, LoadingSpinnerComponent } from '../../components/shared';

interface MetricBucket {
  label: string;
  count: number;
  percent: number;
}

@Component({
  selector: 'app-indicadores',
  standalone: true,
  imports: [DecimalPipe, RouterLink, BadgeEstadoComponent, BadgeTipoComponent, LoadingSpinnerComponent],
  templateUrl: './indicadores.component.html',
  styleUrl: './indicadores.component.scss',
})
export class IndicadoresComponent implements OnInit {
  private getAllPqrsUseCase = inject(GetAllPqrsUseCase);

  loading = signal(true);
  error = signal<string | null>(null);
  pqrs = signal<Pqr[]>([]);

  kpis = computed(() => {
    const list = this.pqrs();
    const total = list.length;
    const respondidasOCerradas = list.filter(
      (p) => p.estado === 'Respondida' || p.estado === 'Cerrada'
    ).length;
    const sinAsignar = list.filter((p) => !p.idResponsable && p.estado !== 'Cerrada').length;
    const tasaResolucion = total > 0 ? (respondidasOCerradas / total) * 100 : 0;

    const cerradasConFecha = list.filter((p) => p.fechaCierre && p.fechaRegistro);
    let promedioDias = 0;
    if (cerradasConFecha.length > 0) {
      const totalDias = cerradasConFecha.reduce((acc, p) => {
        const diffMs = new Date(p.fechaCierre!).getTime() - new Date(p.fechaRegistro).getTime();
        return acc + Math.max(diffMs / (1000 * 60 * 60 * 24), 0);
      }, 0);
      promedioDias = totalDias / cerradasConFecha.length;
    }

    return {
      total,
      enProceso: total - respondidasOCerradas,
      sinAsignar,
      tasaResolucion,
      promedioDias,
    };
  });

  porEstado = computed(() => this.groupBy((p) => p.estado));
  porTipo = computed(() => this.groupBy((p) => p.tipoPqr));
  porCategoria = computed(() => this.groupBy((p) => p.categoria || 'General'));
  pendientesAsignacion = computed(() =>
    this.pqrs()
      .filter((p) => !p.idResponsable && p.estado !== 'Cerrada')
      .slice(0, 5)
  );

  ngOnInit(): void {
    this.getAllPqrsUseCase.execute().subscribe({
      next: (list) => {
        this.pqrs.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'No fue posible cargar los indicadores.');
        this.loading.set(false);
      },
    });
  }

  private groupBy(selector: (p: Pqr) => string): MetricBucket[] {
    const list = this.pqrs();
    const total = list.length || 1;
    const counts = new Map<string, number>();

    for (const item of list) {
      const key = selector(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }
}
