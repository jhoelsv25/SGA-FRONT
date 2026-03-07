import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from '@core/services/confirm-dialog';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { PeriodStore } from '../../services/store/period.store';
import type { Period } from '../../types/period-types';
import { PeriodForm } from '../../components/period-form/period-form';
import { PeriodCardComponent } from '../../components/period-card/period-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';
import { Dropdown } from '@shared/ui/dropdown/dropdown';
import { Select } from '@shared/ui/select/select';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'planned', label: 'Planificado' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

@Component({
  selector: 'sga-periods',
  standalone: true,
  imports: [CommonModule, PeriodCardComponent, EmptyState, Skeleton, ListToolbar, Dropdown, Select],
  templateUrl: './periods.html',
  styleUrls: ['./periods.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PeriodsComponent {
  private dialog = inject(Dialog);
  private confirmDialog = inject(ConfirmDialog);
  private store = inject(PeriodStore);
  private permissionStore = inject(PermissionCheckStore);

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  readonly statusOptions = STATUS_OPTIONS;

  actionDropdownItems = computed(() =>
    this.headerActions().map((action) => ({
      label: action.label,
      icon: action.icon,
      disabled: typeof action.disabled === 'function' ? action.disabled({}) : !!action.disabled,
      action: () => this.onHeaderAction({ action, context: {} }),
    })),
  );
  data = computed(() => this.store.periods());
  loading = computed(() => this.store.loading());
  readonly skeletonItems = [1, 2, 3, 4];

  searchTerm = signal('');
  filterStatus = signal<string>('');

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.filterStatus();
    return list.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search);
      const matchStatus = !status || p.status === status;
      return matchSearch && matchStatus;
    });
  });

  filterCount = computed(() => (this.filterStatus() ? 1 : 0));

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterStatus(value: unknown) {
    this.filterStatus.set(value != null ? String(value) : '');
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }): void {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh(): void {
    this.store.loadAll();
  }

  editPeriod(period: Period): void {
    this.openForm(period);
  }

  deletePeriod(period: Period): void {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar período',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${period.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', variant: 'solid' },
        rejectButtonProps: { label: 'Cancelar', variant: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(period.id);
        }
      });
  }

  createFromEmpty(): void {
    this.openForm();
  }

  private openForm(current?: Period | null): void {
    const ref = this.dialog.open(PeriodForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '500px',
      maxHeight: '500px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
