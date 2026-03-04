import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { BehaviorStore } from '../../services/store/behavior.store';
import { Behavior } from '../../types/behavior-types';
import { BehaviorForm } from '../../components/behavior-form/behavior-form';

@Component({
  selector: 'sga-behaviors',
  imports: [HeaderDetail, DataSource],
  templateUrl: './behaviors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BehaviorsPage {
  private dialog = inject(Dialog);
  private store = inject(BehaviorStore);

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  pagination = computed(() => ({
    ...this.store.pagination(),
    total: this.store.data().length,
  }));
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Behavior;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
  }

  private openForm(current?: Behavior | null) {
    this.dialog.open(BehaviorForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '480px',
    });
  }
}
