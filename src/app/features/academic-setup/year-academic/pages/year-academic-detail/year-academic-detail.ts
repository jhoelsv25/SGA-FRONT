import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Button } from '@shared/directives';

import type { Period, PeriodStatus } from '@features/academic-setup/periods/types/period-types';
import { PeriodCardComponent } from '@features/academic-setup/periods/components/period-card/period-card';
import { Dialog } from '@angular/cdk/dialog';
import { PeriodForm } from '@features/academic-setup/periods/components/period-form/period-form';
import { PeriodApi } from '@features/academic-setup/periods/services/period-api';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { YearAcademicApi } from '../../services/api/year-academic-api';
import type { YearAcademic, YearAcademicPeriod } from '../../types/year-academi-types';

@Component({
  selector: 'sga-year-academic-detail',
  standalone: true,
  imports: [
    CommonModule,
    Button,
    PeriodCardComponent,
    EmptyState,
    Skeleton,
  ],
  templateUrl: './year-academic-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class YearAcademicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(YearAcademicApi);
  private periodApi = inject(PeriodApi);
  private dialog = inject(Dialog);

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
