import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { HeaderDetail } from '@shared/components/header-detail/header-detail';

import { ActionConfig, ActionContext } from '@core/types/action-types';
import { Dialog } from '@angular/cdk/dialog';
import { YearAcademicStore } from '../../services/store/year-academic.store';
import { YearAcademic } from '../../types/year-academi-types';
import { YearAcademicForm } from '../../components/year-academic-form/year-academic-form';
import { CommonModule } from '@angular/common';
import { YearAcademicCardComponent } from '../../components/year-academic-card/year-academic-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { PeriodForm } from '@features/academic-setup/periods/components/period-form/period-form';

@Component({
  selector: 'sga-year-academic',
  standalone: true,
  imports: [CommonModule, HeaderDetail, YearAcademicCardComponent, EmptyState, Skeleton],
  templateUrl: './year-academic.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class YearAcademicComponent {
  private dialog = inject(Dialog);
  private store = inject(YearAcademicStore);
  private router = inject(Router);

  readonly skeletonItems = [1, 2, 3, 4];


  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());

  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    switch (e.action.key) {
      case 'create':
        this.store.setCurrent(null);
        this.openForm();
        break;

      case 'refresh':
        this.onRefresh();
        break;
    }
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as YearAcademic;
    switch (e.action.key) {
      case 'edit':
        this.store.setCurrent(row);
        this.openForm();
        break;

      case 'delete':
        this.store.delete(row.id);
        break;
    }
  }

  onSelectionChange(rows: unknown[]) {
    this.store.setSelected(rows as YearAcademic[]);
  }

  public onRefresh() {
    this.store.load({
      page: this.pagination().page,
      size: this.pagination().size,
    });
  }

  public editYear(year: YearAcademic) {
    this.store.setCurrent(year);
    this.openForm();
  }

  public deleteYear(year: YearAcademic) {
    if (confirm(`¿Estás seguro de eliminar el año académico ${year.name}?`)) {
      this.store.delete(year.id);
    }
  }

  public goToDetail(year: YearAcademic) {
    this.router.navigate(['/academic-setup/years', year.id]);
  }

  public openPeriodForm(year: YearAcademic) {
    const ref = this.dialog.open(PeriodForm, {
      data: {
        yearAcademicId: year.id,
        yearAcademicName: year.name,
      },
      panelClass: 'dialog-top',
      width: '440px',
      maxHeight: '530px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }

  public createFromEmpty() {
    this.store.setCurrent(null);
    this.openForm();
  }

  public openForm() {
    this.dialog.open(YearAcademicForm, {
      data: {
        current: this.store.current(),
      },
      panelClass: 'dialog-top',
      width: '700px',
      maxHeight: '700px'
    });
  }
}
