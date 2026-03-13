import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { ConfirmDialog } from '@core/services/confirm-dialog';
import { SubjectAreaStore } from '../../services/store/subject-area.store';
import { SubjectArea } from '../../types/subject-area-types';
import { SubjectAreaForm } from '../../components/subject-area-form/subject-area-form';
import { CommonModule } from '@angular/common';
import { SubjectAreaCardComponent } from '../../components/subject-area-card/subject-area-card';
import { EmptyState } from '@shared/widgets/ui/empty-state/empty-state';
import { Skeleton } from '@shared/widgets/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/widgets/ui/list-toolbar';
import { Dropdown } from '@shared/adapters/ui/dropdown/dropdown';
import { Select } from '@shared/adapters/ui/select/select';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'core', label: 'Troncal' },
  { value: 'elective', label: 'Electiva' },
  { value: 'optional', label: 'Opcional' },
];

@Component({
  selector: 'sga-subject-areas',
  standalone: true,
  imports: [CommonModule, SubjectAreaCardComponent, EmptyState, Skeleton, ListToolbar, Dropdown, Select],
  templateUrl: './subject-areas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SubjectAreasPage {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(ConfirmDialog);
  private store = inject(SubjectAreaStore);
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

  data = computed(() => this.store.data());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const type = this.filterType();
    return list.filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search) ||
        (a.code?.toLowerCase().includes(search) ?? false);
      const matchType = !type || a.type === type;
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

  loading = computed(() => this.store.loading());

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.load({});
  }

  editSubjectArea(area: SubjectArea) {
    this.openForm(area);
  }

  deleteSubjectArea(area: SubjectArea) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar área curricular',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${area.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', variant: 'solid' },
        rejectButtonProps: { label: 'Cancelar', variant: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(area.id);
        }
      });
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: SubjectArea | null) {
    const ref = this.dialog.open(SubjectAreaForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '520px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
