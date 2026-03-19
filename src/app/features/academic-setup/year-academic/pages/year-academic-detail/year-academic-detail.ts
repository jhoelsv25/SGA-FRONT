import { ZardButtonComponent } from '@/shared/components/button';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import type { Period, PeriodStatus } from '@features/academic-setup/periods/types/period-types';
import { PeriodCardComponent } from '@features/academic-setup/periods/components/period-card/period-card';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { PeriodForm } from '@features/academic-setup/periods/components/period-form/period-form';
import { PeriodApi } from '@features/academic-setup/periods/services/period-api';
import { YearAcademicApi } from '../../services/api/year-academic-api';
import { AcademicYearStatus, Modality, type YearAcademic, type YearAcademicPeriod } from '../../types/year-academi-types';


@Component({
  selector: 'sga-year-academic-detail',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent, PeriodCardComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './year-academic-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class YearAcademicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(YearAcademicApi);
  private periodApi = inject(PeriodApi);
  private dialog = inject(DialogModalService);

  year = signal<YearAcademic | null>(null);
  loading = signal(true);

  periods = signal<Period[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/academic-setup/years']);
      return;
    }
    this.api.getById(id).subscribe({
      next: (data: YearAcademic) => {
        this.year.set(data);
        const list: Period[] = (data.periods ?? []).map((p: YearAcademicPeriod) => ({
          id: p.id,
          name: p.name,
          startDate: typeof p.startDate === 'string' ? p.startDate : (p.startDate as Date)?.toISOString?.()?.slice(0, 10) ?? '',
          endDate: typeof p.endDate === 'string' ? p.endDate : (p.endDate as Date)?.toISOString?.()?.slice(0, 10) ?? '',
          order: p.periodNumber,
          status: (p.status as PeriodStatus) ?? undefined,
          yearAcademic: { id: data.id, name: data.name },
        }));
        this.periods.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/academic-setup/years']);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/academic-setup/years']);
  }

  openPeriodForm(): void {
    const y = this.year();
    if (!y) return;
    const ref = this.dialog.open(PeriodForm, {
      data: {
        yearAcademicId: y.id,
        yearAcademicName: y.name,
      },
      panelClass: 'dialog-top',
      width: '440px',
      maxHeight: '530px',
    });
    ref.closed.subscribe(() => this.refreshPeriods());
  }

  editPeriod(period: Period): void {
    this.dialog.open(PeriodForm, {
      data: { current: period },
      panelClass: 'dialog-top',
      width: '440px',
      maxHeight: '530px',
    }).closed.subscribe(() => this.refreshPeriods());
  }

  deletePeriod(period: Period): void {
    if (!confirm(`¿Eliminar el período "${period.name}"?`)) return;
    this.periodApi.delete(period.id).subscribe({
      next: () => this.refreshPeriods(),
    });
  }

  getStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      [AcademicYearStatus.PLANNED]: 'Planificado',
      [AcademicYearStatus.ONGOING]: 'En curso',
      [AcademicYearStatus.COMPLETED]: 'Cerrado',
      [AcademicYearStatus.CANCELLED]: 'Cancelado',
    };
    return labels[status ?? ''] ?? 'Sin estado';
  }

  getStatusClass(status?: string): string {
    const styles: Record<string, string> = {
      [AcademicYearStatus.PLANNED]: 'border-primary/20 bg-primary/10 text-primary',
      [AcademicYearStatus.ONGOING]: 'border-success/20 bg-success/10 text-success',
      [AcademicYearStatus.COMPLETED]: 'border-border bg-base-200 text-base-content/70',
      [AcademicYearStatus.CANCELLED]: 'border-destructive/20 bg-destructive/10 text-destructive',
    };
    return styles[status ?? ''] ?? 'border-border bg-base-200 text-base-content/70';
  }

  getModalityLabel(modality?: string): string {
    const labels: Record<string, string> = {
      [Modality.IN_PERSON]: 'Presencial',
      [Modality.ONLINE]: 'Virtual',
      [Modality.HYBRID]: 'Híbrido',
    };
    return labels[modality ?? ''] ?? 'No definido';
  }

  private refreshPeriods(): void {
    const y = this.year();
    if (!y?.id) return;
    this.api.getById(y.id).subscribe({
      next: (data: YearAcademic) => {
        this.year.set(data);
        const list: Period[] = (data.periods ?? []).map((p: YearAcademicPeriod) => ({
          id: p.id,
          name: p.name,
          startDate: typeof p.startDate === 'string' ? p.startDate : (p.startDate as Date)?.toISOString?.()?.slice(0, 10) ?? '',
          endDate: typeof p.endDate === 'string' ? p.endDate : (p.endDate as Date)?.toISOString?.()?.slice(0, 10) ?? '',
          order: p.periodNumber,
          status: (p.status as PeriodStatus) ?? undefined,
          yearAcademic: { id: data.id, name: data.name },
        }));
        this.periods.set(list);
      },
    });
  }
}
