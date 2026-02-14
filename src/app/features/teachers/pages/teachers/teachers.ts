import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { TeacherStore } from '../../services/store/teacher.store';
import { Teacher } from '../../types/teacher-types';
import { TeacherForm } from '../../components/teacher-form/teacher-form';
import { TEACHER_HEADER_CONFIG } from '../../config/header.config';
import { TEACHER_COLUMN } from '../../config/column.config';
import { TEACHER_ACTIONS } from '../../config/action.config';

@Component({
  selector: 'sga-teachers',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './teachers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeachersPage {
  private dialog = inject(Dialog);
  private store = inject(TeacherStore);

  headerConfig = computed(() => TEACHER_HEADER_CONFIG);
  columns = computed(() => TEACHER_COLUMN);
  data = computed(() => this.store.teachers());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  headerActions = computed(() => TEACHER_ACTIONS.filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => TEACHER_ACTIONS.filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Teacher;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.loadAll({ page: p.page, size: p.size });
  }

  private openForm(current?: Teacher | null) {
    this.dialog.open(TeacherForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '480px',
    });
  }
}
