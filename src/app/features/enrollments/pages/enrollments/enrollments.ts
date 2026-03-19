import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/widgets/data-source/data-source';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { EnrollmentStore } from '../../services/store/enrollment.store';
import { Enrollment } from '../../types/enrollment-types';
import { EnrollmentForm } from '../../components/enrollment-form/enrollment-form';

import { UrlParamsService } from '@core/services/url-params.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardFormImports } from '@/shared/components/form';

@Component({
  selector: 'sga-enrollments',
  standalone: true,
  imports: [HeaderDetail, DataSource, FormsModule, ZardInputDirective, ZardButtonComponent, SelectOptionComponent, ...ZardFormImports],
  templateUrl: './enrollments.html',
  styleUrl: './enrollments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Enrollments {
  private dialog = inject(DialogModalService);
  private store = inject(EnrollmentStore);
  private urlParams = inject(UrlParamsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public studentContextId = signal('');
  public studentContextName = signal('');

  public filterSearch = signal('');
  public filterStatus = signal('');
  public hasActiveFilters = computed(() => !!this.filterSearch() || !!this.filterStatus());
  
  public statuses = [
    { value: '', label: 'Todos' },
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'graduated', label: 'Graduado' }
  ];

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      this.filterSearch.set(params['search'] || '');
      this.filterStatus.set(params['status'] || '');
      this.studentContextId.set(params['studentId'] || '');
      this.studentContextName.set(params['studentName'] || '');
      this.store.loadAll({
        ...params
      });
    });
  }
  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  /** Lista completa para búsqueda y paginación en DataSource. */
  data = computed(() =>
    this.store.enrollments()
      .filter((e) => !this.studentContextId() || e.student?.id === this.studentContextId())
      .map((e) => ({
      id: e.id,
      enrollment: e,
      studentName: `${e.student?.firstName ?? ''} ${e.student?.lastName ?? ''}`.trim() || (e.student?.studentCode ?? ''),
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
    if (e.action.key === 'refresh') this.store.loadAll({ ...this.urlParams.getAllParams() });
  }

  applyFilters() {
    this.urlParams.setParams({
      search: this.filterSearch(),
      status: this.filterStatus()
    });
  }

  clearFilters() {
    this.urlParams.clearParams();
  }

  clearStudentContext() {
    this.router.navigate(['/students/enrollments'], {
      queryParams: {
        search: this.filterSearch() || null,
        status: this.filterStatus() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
