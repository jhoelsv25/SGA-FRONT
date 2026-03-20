import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
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
import { EnrollmentCardComponent } from '../../components/enrollment-card/enrollment-card';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';

@Component({
  selector: 'sga-enrollments',
  standalone: true,
  imports: [HeaderDetail, FormsModule, ZardInputDirective, ZardButtonComponent, SelectOptionComponent, EnrollmentCardComponent, ZardEmptyComponent, ZardSkeletonComponent, ...ZardFormImports],
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
    { value: 'enrolled', label: 'Matriculado' },
    { value: 'completed', label: 'Completado' },
    { value: 'dropped', label: 'Retirado' },
    { value: 'graduated', label: 'Egresado' }
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
  readonly enrollmentCards = computed(() =>
    this.store.enrollments()
      .filter((e) => !this.studentContextId() || e.student?.id === this.studentContextId())
      .filter((e) => {
        const search = this.filterSearch().trim().toLowerCase();
        if (!search) return true;
        const candidate = [
          e.student?.firstName,
          e.student?.lastName,
          e.student?.studentCode,
          e.section?.name,
          e.academicYear?.year,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return candidate.includes(search);
      })
      .filter((e) => !this.filterStatus() || e.status === this.filterStatus()),
  );
  loading = computed(() => this.store.loading());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  readonly enrolledCount = computed(() => this.enrollmentCards().filter((item) => item.status === 'enrolled').length);
  readonly completedCount = computed(() => this.enrollmentCards().filter((item) => item.status === 'completed').length);
  readonly droppedCount = computed(() => this.enrollmentCards().filter((item) => item.status === 'dropped').length);
  readonly graduatedCount = computed(() => this.enrollmentCards().filter((item) => item.status === 'graduated').length);

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

  viewDetail(enrollment: Enrollment) {
    this.router.navigate(['/students/enrollments', enrollment.id], {
      state: { enrollment },
    });
  }

  editEnrollment(enrollment: Enrollment) {
    this.openForm(enrollment);
  }

  deleteEnrollment(enrollment: Enrollment) {
    this.store.delete(enrollment.id);
  }

  private openForm(current?: Enrollment | null) {
    this.dialog.open(EnrollmentForm, {
      data: { current: current ?? null },
      width: '520px',
      maxHeight: '80vh',
    });
  }
}
