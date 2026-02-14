import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { GradeLevelStore } from '../../services/store/grade-level.store';
import { GradeLevel } from '../../types/grade-level-types';
import { GradeLevelForm } from '../../components/grade-level-form/grade-level-form';

@Component({
  selector: 'sga-grade-levels',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './grade-levels.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GradeLevelsPage {
  private dialog = inject(Dialog);
  private store = inject(GradeLevelStore);

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => {
    const all = this.store.data();
    const p = this.store.pagination();
    return all.slice((p.page - 1) * p.size, p.page * p.size);
  });
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
    const row = e.context.row as GradeLevel;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
  }

  private openForm(current?: GradeLevel | null) {
    this.dialog.open(GradeLevelForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
    });
  }
}
