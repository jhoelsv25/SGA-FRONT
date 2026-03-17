import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { DropdownOptionComponent, DropdownItem } from '@/shared/widgets/dropdown-option/dropdown-option';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { GradeLevelStore } from '../../services/store/grade-level.store';
import { GradeLevel } from '../../types/grade-level-types';
import { GradeLevelForm } from '../../components/grade-level-form/grade-level-form';
import { CommonModule } from '@angular/common';
import { GradeLevelCardComponent } from '../../components/grade-level-card/grade-level-card';

import { ZardDropdownMenuComponent } from '@/shared/components/dropdown';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

const LEVEL_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'primary', label: 'Primaria' },
  { value: 'secondary', label: 'Secundaria' },
  { value: 'higher', label: 'Superior' }];


@Component({
  selector: 'sga-grade-levels',
  standalone: true,
  imports: [CommonModule, GradeLevelCardComponent, ZardEmptyComponent, ZardSkeletonComponent, DropdownOptionComponent, SelectOptionComponent, ListToolbarComponent],
  templateUrl: './grade-levels.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GradeLevelsPage {
  private dialog = inject(DialogModalService);
  private router = inject(Router);
  private confirmDialog = inject(DialogConfirmService);
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
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
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
