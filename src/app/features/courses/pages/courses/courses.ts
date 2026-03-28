import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { CourseStore } from '../../services/store/course.store';
import type { Course } from '../../types/course-types';
import { CourseForm } from '../../components/course-form/course-form';
import { CommonModule } from '@angular/common';
import { CourseCardComponent } from '../../components/course-card/course-card';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardFormImports } from '@/shared/components/form';
import { ActivatedRoute, Router } from '@angular/router';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'mandatory', label: 'Obligatorios' },
  { value: 'elective', label: 'Electivos' },
];


@Component({
  selector: 'sga-courses',
  standalone: true,
  imports: [CommonModule, HeaderDetail, CourseCardComponent, ZardEmptyComponent, ZardSkeletonComponent, SelectOptionComponent, FormsModule, ZardInputDirective, ZardButtonComponent, ...ZardFormImports],
  templateUrl: './courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CoursesPage implements OnInit {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(DialogConfirmService);
  private store = inject(CourseStore);
  private permissionStore = inject(PermissionCheckStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly typeOptions = TYPE_OPTIONS;
  searchTerm = signal('');
  filterType = signal<string>('');
  gradeContextId = signal('');
  gradeContextName = signal('');
  subjectAreaContextId = signal('');
  subjectAreaContextName = signal('');
  readonly canManageCourses = computed(() =>
    this.permissionStore.hasAny('course:create', 'course:update', 'course:delete'),
  );
  readonly headerConfig = computed(() => this.store.headerConfig());

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  data = computed(() => this.store.courses());
  loading = computed(() => this.store.loading());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const type = this.filterType();
    const gradeId = this.gradeContextId();
    const subjectAreaId = this.subjectAreaContextId();
    return list.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        (c.code?.toLowerCase().includes(search) ?? false);
      const matchType =
        !type ||
        (type === 'mandatory' && c.isMandatory !== false) ||
        (type === 'elective' && c.isMandatory === false);
      const matchGrade = !gradeId || c.grade?.id === gradeId;
      const matchSubjectArea = !subjectAreaId || c.subjectArea?.id === subjectAreaId;
      return matchSearch && matchType && matchGrade && matchSubjectArea;
    });
  });

  filterCount = computed(() => (this.filterType() ? 1 : 0));
  hasActiveFilters = computed(() => !!this.searchTerm().trim() || !!this.filterType());
  groupedData = computed(() => {
    const groups = new Map<string, Course[]>();

    for (const course of this.filteredData()) {
      const key = course.subjectArea?.name?.trim() || 'Sin área curricular';
      const current = groups.get(key) ?? [];
      current.push(course);
      groups.set(key, current);
    }

    return Array.from(groups.entries())
      .map(([label, items]) => ({
        key: label,
        label,
        description: label === 'Sin área curricular'
          ? 'Cursos todavía no vinculados a un área'
          : 'Cursos agrupados dentro de la misma área curricular',
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const gradeId = params.get('gradeId') ?? '';
      const gradeName = params.get('gradeName') ?? '';
      const subjectAreaId = params.get('subjectAreaId') ?? '';
      const subjectAreaName = params.get('subjectAreaName') ?? '';
      this.gradeContextId.set(gradeId);
      this.gradeContextName.set(gradeName);
      this.subjectAreaContextId.set(subjectAreaId);
      this.subjectAreaContextName.set(subjectAreaName);
      this.store.loadAll({
        ...(gradeId ? { gradeId } : {}),
        ...(subjectAreaId ? { subjectAreaId } : {}),
      });
    });
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterType(value: unknown) {
    this.filterType.set(value != null ? String(value) : '');
  }

  clearFilters() {
    this.searchTerm.set('');
    this.filterType.set('');
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    const gradeId = this.gradeContextId();
    const subjectAreaId = this.subjectAreaContextId();
    this.store.loadAll({
      ...(gradeId ? { gradeId } : {}),
      ...(subjectAreaId ? { subjectAreaId } : {}),
    });
  }

  editCourse(course: Course) {
    this.openForm(course);
  }

  goToSectionCourses(course: Course) {
    this.router.navigate(['/organization/section-courses'], {
      queryParams: { courseId: course.id, courseName: course.name },
    });
  }

  goToCompetencies(course: Course) {
    this.router.navigate(['/academic-setup/competencies'], {
      queryParams: { courseId: course.id, courseName: course.name },
    });
  }

  goToSchedules(course: Course) {
    this.router.navigate(['/organization/schedules'], {
      queryParams: { courseId: course.id, courseName: course.name },
    });
  }

  clearGradeContext() {
    this.router.navigate(['/academic-setup/courses']);
  }

  clearSubjectAreaContext() {
    this.router.navigate(['/academic-setup/courses']);
  }

  deleteCourse(course: Course) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar curso',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${course.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(course.id);
        }
      });
  }

  createFromEmpty() {
    if (!this.canManageCourses()) return;
    this.openForm();
  }

  openForm(current?: Course | null) {
    if (!this.canManageCourses() && !current) return;
    const ref = this.dialog.open(CourseForm, {
      data: { current: current ?? null },
      width: '560px',
      maxHeight: '80vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
