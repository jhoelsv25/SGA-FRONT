import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { ConfirmDialog } from '@core/services/confirm-dialog';
import { CourseStore } from '../../services/store/course.store';
import type { Course } from '../../types/course-types';
import { CourseForm } from '../../components/course-form/course-form';
import { CommonModule } from '@angular/common';
import { CourseCardComponent } from '../../components/course-card/course-card';
import { EmptyState } from '@shared/widgets/ui/empty-state/empty-state';
import { Skeleton } from '@shared/widgets/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/widgets/ui/list-toolbar';
import { Dropdown } from '@shared/adapters/ui/dropdown/dropdown';
import { Select } from '@shared/adapters/ui/select/select';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'mandatory', label: 'Obligatorios' },
  { value: 'elective', label: 'Electivos' },
];

@Component({
  selector: 'sga-courses',
  standalone: true,
  imports: [CommonModule, CourseCardComponent, EmptyState, Skeleton, ListToolbar, Dropdown, Select],
  templateUrl: './courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CoursesPage {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(ConfirmDialog);
  private store = inject(CourseStore);
  private permissionStore = inject(PermissionCheckStore);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly typeOptions = TYPE_OPTIONS;
  searchTerm = signal('');
  filterType = signal<string>('');

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  actionDropdownItems = computed(() =>
    this.headerActions().map((action) => ({
      label: action.label,
      icon: action.icon,
      disabled: typeof action.disabled === 'function' ? action.disabled({}) : !!action.disabled,
      action: () => this.onHeaderAction({ action, context: {} }),
    })),
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

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterType(value: unknown) {
    this.filterType.set(value != null ? String(value) : '');
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
        acceptButtonProps: { label: 'Eliminar', color: 'danger', variant: 'solid' },
        rejectButtonProps: { label: 'Cancelar', variant: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(course.id);
        }
      });
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: Course | null) {
    const ref = this.dialog.open(CourseForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
