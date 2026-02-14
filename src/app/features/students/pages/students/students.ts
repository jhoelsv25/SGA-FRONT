import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { StudentStore } from '../../services/store/student.store';
import { Student } from '../../types/student-types';
import { StudentForm } from '../../components/student-form/student-form';
import { STUDENT_HEADER_CONFIG } from '../../config/header.config';
import { STUDENT_COLUMN } from '../../config/column.config';
import { STUDENT_ACTIONS } from '../../config/action.config';

@Component({
  selector: 'sga-students',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './students.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentsPage {
  private dialog = inject(Dialog);
  private store = inject(StudentStore);

  headerConfig = computed(() => STUDENT_HEADER_CONFIG);
  columns = computed(() => STUDENT_COLUMN);
  data = computed(() => this.store.students());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  headerActions = computed(() => STUDENT_ACTIONS.filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => STUDENT_ACTIONS.filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Student;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.loadAll({ page: p.page, size: p.size });
  }

  private openForm(current?: Student | null) {
    this.dialog.open(StudentForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '480px',
    });
  }
}
