import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { SectionCourseStore } from '../../services/store/section-course.store';
import type { SectionCourse } from '../../types/section-course-types';
import { SectionCourseForm } from '../../components/section-course-form/section-course-form';
import { CommonModule } from '@angular/common';
import { SectionCourseCardComponent } from '../../components/section-course-card/section-course-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';
import { Dropdown } from '@shared/ui/dropdown/dropdown';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { ConfirmDialog } from '@core/services/confirm-dialog';

@Component({
  selector: 'sga-section-courses',
  standalone: true,
  imports: [CommonModule, SectionCourseCardComponent, EmptyState, Skeleton, ListToolbar, Dropdown],
  templateUrl: './section-courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SectionCoursesPage {
  private dialog = inject(Dialog);
  private store = inject(SectionCourseStore);
  private permissionStore = inject(PermissionCheckStore);
  private confirmDialog = inject(ConfirmDialog);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');

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

  data = computed(() => this.store.data());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return list;
    return list.filter((sc) => {
      const courseName = sc.course?.name?.toLowerCase() ?? '';
      const sectionName = sc.section?.name?.toLowerCase() ?? '';
      return courseName.includes(search) || sectionName.includes(search);
    });
  });

  loading = computed(() => this.store.loading());

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onRefresh() {
    this.store.loadAll({});
  }

  editSectionCourse(sc: SectionCourse) {
    this.openForm(sc);
  }

  deleteSectionCourse(sc: SectionCourse) {
    const label = sc.course?.name && sc.section?.name ? `${sc.course.name} - ${sc.section.name}` : sc.id;
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar asignación',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar la asignación "${label}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', variant: 'solid' },
        rejectButtonProps: { label: 'Cancelar', variant: 'outline' },
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

  openForm(current?: SectionCourse | null) {
    const ref = this.dialog.open(SectionCourseForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
      maxHeight: '60vh',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
