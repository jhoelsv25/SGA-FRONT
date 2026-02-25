import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { PeriodStore } from '../../services/store/period.store';
import type { Period } from '../../types/period-types';
import { PeriodForm } from '../../components/period-form/period-form';

@Component({
  selector: 'sga-periods',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './periods.html',
  styleUrls: ['./periods.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PeriodsComponent {
  private dialog = inject(Dialog);
  private store = inject(PeriodStore);

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => {
    const all = this.store.periods();
    const p = this.store.pagination();
    return all.slice((p.page - 1) * p.size, p.page * p.size);
  });
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }): void {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }): void {
    const row = e.context.row as Period;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }): void {
    this.store.setPagination(p.page, p.size);
  }

  private openForm(current?: Period | null): void {
    this.dialog.open(PeriodForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '440px',
    });
  }
}
