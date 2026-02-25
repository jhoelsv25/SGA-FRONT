import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { EnrollmentStore } from '../../services/store/enrollment.store';
import { Enrollment } from '../../types/enrollment-types';
import { EnrollmentForm } from '../../components/enrollment-form/enrollment-form';

@Component({
  selector: 'sga-enrollments',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './enrollments.html',
  styleUrl: './enrollments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Enrollments {
  private dialog = inject(Dialog);
  private store = inject(EnrollmentStore);

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  /** Lista completa para búsqueda y paginación en DataSource. */
  data = computed(() =>
    this.store.enrollments().map((e) => ({
      id: e.id,
      enrollment: e,
      studentName: `${e.student?.firstName ?? ''} ${e.student?.lastName ?? ''}`.trim() || e.student?.studentCode ?? '',
      sectionName: e.section?.name ?? '',
      enrollmentType: e.enrollmentType,
      status: e.status,
      enrollmentDate: e.enrollmentDate,
    })),
  );
  loading = computed(() => this.store.loading());
  pagination = computed(() => ({
    ...this.store.pagination(),
    total: this.store.enrollments().length,
  }));
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll({});
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as { id: string; enrollment: Enrollment };
    if (e.action.key === 'edit') this.openForm(row.enrollment);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
  }

  private openForm(current?: Enrollment | null) {
    this.dialog.open(EnrollmentForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '520px',
    });
  }
}
