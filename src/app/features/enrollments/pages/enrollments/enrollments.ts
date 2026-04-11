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
import { StudentApi } from '../../../students/services/api/student-api';
import { Student } from '../../../students/types/student-types';
import { SectionCourseApi } from '../../../section-courses/services/section-course-api';
import { SectionCourse } from '../../../section-courses/types/section-course-types';
import { EnrollmentApi } from '../../services/enrollment-api';
import { Toast } from '@core/services/toast';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'sga-enrollments',

  imports: [
    HeaderDetail,
    FormsModule,
    ZardInputDirective,
    ZardButtonComponent,
    SelectOptionComponent,
    EnrollmentCardComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ...ZardFormImports,
  ],
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
  private studentApi = inject(StudentApi);
  private sectionCourseApi = inject(SectionCourseApi);
  private enrollmentApi = inject(EnrollmentApi);
  private toast = inject(Toast);
  public studentContextId = signal('');
  public studentContextName = signal('');
  public sectionCourseContextId = signal('');
  public sectionCourseContextLabel = signal('');
  public sectionCourseContext = signal<SectionCourse | null>(null);
  public availableStudents = signal<Student[]>([]);
  public academicYearEnrollments = signal<Enrollment[]>([]);
  public studentSearch = signal('');
  public selectedStudentIds = signal<string[]>([]);
  public studentPage = signal(1);
  public readonly studentPageSize = 30;
  public loadingStudents = signal(false);
  public studentHasMore = signal(true);
  public assigningStudents = signal(false);

  public filterSearch = signal('');
  public filterStatus = signal('');
  public hasActiveFilters = computed(() => !!this.filterSearch() || !!this.filterStatus());

  public statuses = [
    { value: '', label: 'Todos' },
    { value: 'enrolled', label: 'Matriculado' },
    { value: 'completed', label: 'Completado' },
    { value: 'dropped', label: 'Retirado' },
    { value: 'graduated', label: 'Egresado' },
  ];

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.filterSearch.set(params['search'] || '');
      this.filterStatus.set(params['status'] || '');
      this.studentContextId.set(params['studentId'] || '');
      this.studentContextName.set(params['studentName'] || '');
      this.sectionCourseContextId.set(params['sectionCourse'] || '');
      this.sectionCourseContextLabel.set(
        [params['courseName'], params['sectionName'] ? `Sección ${params['sectionName']}` : '']
          .filter(Boolean)
          .join(' · '),
      );
      this.store.loadAll({
        ...params,
      });

      if (params['sectionCourse']) {
        this.loadSectionCourseContext(params['sectionCourse']);
        this.resetStudentAssignmentFeed();
      } else {
        this.sectionCourseContext.set(null);
        this.availableStudents.set([]);
        this.selectedStudentIds.set([]);
      }
    });
  }
  headerConfig = computed(() => this.store.headerConfig());
  readonly enrollmentCards = computed(() =>
    this.store
      .enrollments()
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
  readonly enrolledCount = computed(
    () => this.enrollmentCards().filter((item) => item.status === 'enrolled').length,
  );
  readonly completedCount = computed(
    () => this.enrollmentCards().filter((item) => item.status === 'completed').length,
  );
  readonly droppedCount = computed(
    () => this.enrollmentCards().filter((item) => item.status === 'dropped').length,
  );
  readonly graduatedCount = computed(
    () => this.enrollmentCards().filter((item) => item.status === 'graduated').length,
  );
  readonly enrolledStudentIds = computed(
    () =>
      new Set(
        this.enrollmentCards()
          .map((item) => item.student?.id)
          .filter(Boolean),
      ),
  );
  readonly filteredAvailableStudents = computed(() => {
    const search = this.studentSearch().trim().toLowerCase();
    const enrolledIds = this.enrolledStudentIds();
    return this.availableStudents().filter((student) => {
      if (enrolledIds.has(student.id)) return false;
      if (!search) return true;
      const candidate = [
        student.firstName,
        student.lastName,
        student.studentCode,
        student.email,
        student.grade,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return candidate.includes(search);
    });
  });
  readonly selectedStudentsCount = computed(() => this.selectedStudentIds().length);
  readonly maxSlots = computed(() => this.sectionCourseContext()?.maxStudents ?? 0);
  readonly occupiedSlots = computed(
    () => this.sectionCourseContext()?.enrolledStudents ?? this.enrolledCount(),
  );
  readonly remainingSlots = computed(() => Math.max(this.maxSlots() - this.occupiedSlots(), 0));
  readonly hasCapacity = computed(() => this.remainingSlots() > 0 || this.maxSlots() === 0);
  readonly canAssignSelected = computed(() => {
    if (!this.selectedStudentsCount()) return false;
    if (this.maxSlots() === 0) return true;
    return this.selectedStudentsCount() <= this.remainingSlots();
  });
  readonly occupiedEnrollmentMap = computed(() => {
    const currentSectionId = this.sectionCourseContext()?.section?.id ?? '';
    return this.academicYearEnrollments().reduce(
      (acc, enrollment) => {
        const studentId = enrollment.student?.id;
        if (!studentId) return acc;
        if (enrollment.section?.id === currentSectionId) return acc;
        acc[studentId] = enrollment;
        return acc;
      },
      {} as Record<string, Enrollment>,
    );
  });

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll({ ...this.urlParams.getAllParams() });
  }

  applyFilters() {
    this.urlParams.setParams({
      search: this.filterSearch(),
      status: this.filterStatus(),
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

  clearSectionCourseContext() {
    this.router.navigate(['/students/enrollments'], {
      queryParams: {
        sectionCourse: null,
        courseName: null,
        sectionName: null,
        search: this.filterSearch() || null,
        status: this.filterStatus() || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onStudentSearch(value: string) {
    this.studentSearch.set(value);
    this.studentPage.set(1);
    this.studentHasMore.set(true);
    this.availableStudents.set([]);
    this.loadAvailableStudents();
  }

  toggleStudentSelection(studentId: string, checked: boolean) {
    if (!this.canSelectStudent(studentId)) return;
    this.selectedStudentIds.update((current) => {
      if (checked) return [...new Set([...current, studentId])];
      return current.filter((id) => id !== studentId);
    });
  }

  loadMoreStudents() {
    if (this.loadingStudents() || !this.studentHasMore() || !this.sectionCourseContextId()) return;
    this.loadAvailableStudents();
  }

  assignSelectedStudents() {
    const sectionCourse = this.sectionCourseContext();
    const studentIds = this.selectedStudentIds();
    if (
      !sectionCourse?.section?.id ||
      !sectionCourse?.academicYear?.id ||
      !studentIds.length ||
      !this.canAssignSelected()
    )
      return;

    this.assigningStudents.set(true);
    const baseOrder = this.enrollmentCards().length;
    const now = Date.now();

    forkJoin(
      studentIds.map((studentId, index) =>
        this.enrollmentApi.create({
          code: `ENR-${now}-${index + 1}`,
          student: studentId,
          section: sectionCourse.section!.id,
          academicYear: sectionCourse.academicYear!.id,
          enrollmentType: 'new',
          status: 'enrolled',
          enrollmentDate: new Date().toISOString().slice(0, 10),
          orderNumber: baseOrder + index + 1,
          observations: '',
          previusSchool: '',
          previousGrade: '',
          previusYear: new Date().getFullYear() - 1,
          previusAverage: 0,
          isRepeating: false,
          hasSpecialNeeds: false,
          hasScholarship: false,
        } as any),
      ),
    ).subscribe({
      next: () => {
        this.toast.success('Estudiantes asignados correctamente');
        this.assigningStudents.set(false);
        this.selectedStudentIds.set([]);
        this.store.loadAll({ ...this.urlParams.getAllParams() });
        this.resetStudentAssignmentFeed();
        this.loadAcademicYearEnrollments();
      },
      error: (error) => {
        this.assigningStudents.set(false);
        this.toast.error('Error al asignar estudiantes: ' + (error?.message ?? ''));
      },
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

  private loadSectionCourseContext(id: string) {
    this.sectionCourseApi.getById(id).subscribe({
      next: (sectionCourse) => {
        this.sectionCourseContext.set(sectionCourse);
        if (!this.sectionCourseContextLabel()) {
          this.sectionCourseContextLabel.set(
            [
              sectionCourse.course?.name,
              sectionCourse.section?.name ? `Sección ${sectionCourse.section.name}` : '',
            ]
              .filter(Boolean)
              .join(' · '),
          );
        }
        this.loadAcademicYearEnrollments();
      },
      error: () => {
        this.sectionCourseContext.set(null);
        this.academicYearEnrollments.set([]);
      },
    });
  }

  private resetStudentAssignmentFeed() {
    this.studentPage.set(1);
    this.studentHasMore.set(true);
    this.availableStudents.set([]);
    this.selectedStudentIds.set([]);
    this.loadAvailableStudents();
  }

  canSelectStudent(studentId: string): boolean {
    if (this.occupiedEnrollmentMap()[studentId]) return false;
    if (this.maxSlots() === 0) return true;
    if (this.selectedStudentIds().includes(studentId)) return true;
    return this.selectedStudentsCount() < this.remainingSlots();
  }

  private loadAcademicYearEnrollments() {
    const academicYearId = this.sectionCourseContext()?.academicYear?.id;
    if (!academicYearId) {
      this.academicYearEnrollments.set([]);
      return;
    }

    this.enrollmentApi.getAll({ academicYearId }).subscribe({
      next: (response) => {
        this.academicYearEnrollments.set(response.data ?? []);
      },
      error: () => {
        this.academicYearEnrollments.set([]);
      },
    });
  }

  private loadAvailableStudents() {
    if (this.loadingStudents() || !this.studentHasMore()) return;
    this.loadingStudents.set(true);
    this.studentApi
      .getAll({
        page: this.studentPage(),
        size: this.studentPageSize,
        ...(this.studentSearch().trim() ? { search: this.studentSearch().trim() } : {}),
      })
      .subscribe({
        next: (response) => {
          const incoming = response.data ?? [];
          this.availableStudents.update((current) =>
            this.studentPage() === 1
              ? incoming
              : [
                  ...current,
                  ...incoming.filter(
                    (item) => !current.some((existing) => existing.id === item.id),
                  ),
                ],
          );
          const loadedCount =
            this.studentPage() === 1 ? incoming.length : this.availableStudents().length;
          this.studentHasMore.set(loadedCount < (response.total ?? loadedCount));
          this.studentPage.update((page) => page + 1);
          this.loadingStudents.set(false);
        },
        error: () => {
          this.loadingStudents.set(false);
        },
      });
  }
}
