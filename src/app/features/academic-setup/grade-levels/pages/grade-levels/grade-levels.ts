import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { ConfirmDialog } from '@core/services/confirm-dialog';
import { GradeLevelStore } from '../../services/store/grade-level.store';
import { GradeLevel } from '../../types/grade-level-types';
import { GradeLevelForm } from '../../components/grade-level-form/grade-level-form';
import { CommonModule } from '@angular/common';
import { GradeLevelCardComponent } from '../../components/grade-level-card/grade-level-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';
import { Dropdown } from '@shared/ui/dropdown/dropdown';
import { Select } from '@shared/ui/select/select';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

const LEVEL_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'primary', label: 'Primaria' },
  { value: 'secondary', label: 'Secundaria' },
  { value: 'higher', label: 'Superior' },
];

@Component({
  selector: 'sga-grade-levels',
  standalone: true,
  imports: [CommonModule, GradeLevelCardComponent, EmptyState, Skeleton, ListToolbar, Dropdown, Select],
  templateUrl: './grade-levels.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GradeLevelsPage {
  private dialog = inject(Dialog);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialog);
  private store = inject(GradeLevelStore);
  private permissionStore = inject(PermissionCheckStore);

  readonly skeletonItems = [1, 2, 3, 4];
  readonly levelOptions = LEVEL_OPTIONS;
  searchTerm = signal('');
  filterLevel = signal<string>('');

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
    const level = this.filterLevel();
    return list.filter((g) => {
      const matchSearch = !search || g.name.toLowerCase().includes(search);
      const matchLevel = !level || g.level === level;
      return matchSearch && matchLevel;
    });
  });

  filterCount = computed(() => (this.filterLevel() ? 1 : 0));

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterLevel(value: unknown) {
    this.filterLevel.set(value != null ? String(value) : '');
  }
  loading = computed(() => this.store.loading());
  pagination = computed(() => ({
    ...this.store.pagination(),
    total: this.store.data().length,
  }));
  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as GradeLevel;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.deleteGradeLevel(row);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
  }

  editGradeLevel(gradeLevel: GradeLevel) {
    this.openForm(gradeLevel);
  }

  goToSections(gradeLevel: GradeLevel) {
    this.router.navigate(['/organization/sections'], {
      queryParams: { gradeId: gradeLevel.id },
    });
  }

  deleteGradeLevel(gradeLevel: GradeLevel) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar nivel de grado',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${gradeLevel.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', variant: 'solid' },
        rejectButtonProps: { label: 'Cancelar', variant: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(gradeLevel.id);
        }
      });
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: GradeLevel | null) {
    const ref = this.dialog.open(GradeLevelForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
      maxHeight: '500px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
