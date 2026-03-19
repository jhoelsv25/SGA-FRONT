import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { SectionCourseStore } from '../../services/store/section-course.store';
import type { SectionCourse } from '../../types/section-course-types';
import { SectionCourseForm } from '../../components/section-course-form/section-course-form';
import { CommonModule } from '@angular/common';
import { SectionCourseCardComponent } from '../../components/section-course-card/section-course-card';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardFormImports } from '@/shared/components/form';
import { ScheduleForm } from '../../../schedules/components/schedule-form/schedule-form';


@Component({
  selector: 'sga-section-courses',
  standalone: true,
  imports: [CommonModule, HeaderDetail, SectionCourseCardComponent, ZardEmptyComponent, ZardSkeletonComponent, FormsModule, ZardInputDirective, ZardButtonComponent, ...ZardFormImports],
  templateUrl: './section-courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SectionCoursesPage {
  private dialog = inject(DialogModalService);
  private store = inject(SectionCourseStore);
  private permissionStore = inject(PermissionCheckStore);
  private confirmDialog = inject(DialogConfirmService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');
  courseId = signal('');
  sectionId = signal('');
  teacherId = signal('');
  courseName = signal('');
  sectionName = signal('');
  teacherName = signal('');
  headerConfig = computed(() => this.store.headerConfig());

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  data = computed(() => this.store.data());
  hasActiveFilters = computed(() => !!this.searchTerm().trim());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const courseId = this.courseId();
    const sectionId = this.sectionId();
    const teacherId = this.teacherId();
    return list.filter((sc) => {
      const courseName = sc.course?.name?.toLowerCase() ?? '';
      const sectionName = sc.section?.name?.toLowerCase() ?? '';
      const teacherLabel =
        [sc.teacher?.person?.firstName, sc.teacher?.person?.lastName].filter(Boolean).join(' ').toLowerCase() ||
        sc.teacher?.teacherCode?.toLowerCase() ||
        '';
      const matchSearch =
        !search || courseName.includes(search) || sectionName.includes(search) || teacherLabel.includes(search);
      const matchCourse = !courseId || sc.course?.id === courseId;
      const matchSection = !sectionId || sc.section?.id === sectionId;
      const matchTeacher = !teacherId || sc.teacher?.id === teacherId;
      return matchSearch && matchCourse && matchSection && matchTeacher;
    });
  });

  loading = computed(() => this.store.loading());

  constructor() {
    this.route.queryParams.subscribe((params) => {
      this.courseId.set(params['courseId'] ?? '');
      this.sectionId.set(params['sectionId'] ?? '');
      this.teacherId.set(params['teacherId'] ?? '');
      this.courseName.set(params['courseName'] ?? '');
      this.sectionName.set(params['sectionName'] ?? '');
      this.teacherName.set(params['teacherName'] ?? '');
      this.store.loadAll({
        ...(params['courseId'] ? { courseId: params['courseId'] } : {}),
        ...(params['sectionId'] ? { sectionId: params['sectionId'] } : {}),
        ...(params['teacherId'] ? { teacherId: params['teacherId'] } : {}),
      });
    });
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  clearFilters() {
    this.searchTerm.set('');
  }

  onRefresh() {
    this.store.loadAll({
      ...(this.courseId() ? { courseId: this.courseId() } : {}),
      ...(this.sectionId() ? { sectionId: this.sectionId() } : {}),
      ...(this.teacherId() ? { teacherId: this.teacherId() } : {}),
    });
  }

  editSectionCourse(sc: SectionCourse) {
    this.openForm(sc);
  }

  assignTeacher(sc: SectionCourse) {
    this.openForm(sc);
  }

  goToSchedules(sc: SectionCourse) {
    this.router.navigate(['/organization/schedules'], {
      queryParams: {
        sectionCourseId: sc.id,
        sectionName: sc.section?.name ?? '',
        courseName: sc.course?.name ?? '',
      },
    });
  }

  createSchedule(sc: SectionCourse) {
    const ref = this.dialog.open(ScheduleForm, {
      data: { preselectedSectionCourse: sc },
      width: '760px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }

  deleteSectionCourse(sc: SectionCourse) {
    const label = sc.course?.name && sc.section?.name ? `${sc.course.name} - ${sc.section.name}` : sc.id;
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar asignación',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar la asignación "${label}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(sc.id).subscribe({ next: () => this.onRefresh() });
        }
      });
  }

  createFromEmpty() {
    this.openForm();
  }

  clearContext() {
    this.router.navigate(['/organization/section-courses']);
  }

  openForm(current?: SectionCourse | null) {
    const ref = this.dialog.open(SectionCourseForm, {
      data: { current: current ?? null },
      width: '560px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
