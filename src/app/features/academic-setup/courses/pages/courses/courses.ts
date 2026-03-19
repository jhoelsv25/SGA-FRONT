import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
export default class CoursesPage {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(DialogConfirmService);
  private store = inject(CourseStore);
  private permissionStore = inject(PermissionCheckStore);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly typeOptions = TYPE_OPTIONS;
  searchTerm = signal('');
  filterType = signal<string>('');
  readonly canManageCourses = computed(() => this.permissionStore.has('manage_course'));
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
    return list.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        (c.code?.toLowerCase().includes(search) ?? false);
      const matchType =
        !type ||
        (type === 'mandatory' && c.isMandatory !== false) ||
        (type === 'elective' && c.isMandatory === false);
      return matchSearch && matchType;
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
    this.store.loadAll({});
  }

  editCourse(course: Course) {
    this.openForm(course);
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
      panelClass: 'dialog-top',
      width: '560px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
