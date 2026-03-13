import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { ScheduleStore } from '../../services/store/schedule.store';
import { Schedule } from '../../types/schedule-types';
import { ScheduleForm } from '../../components/schedule-form/schedule-form';
import { ScheduleCalendarComponent } from '../../components/schedule-calendar/schedule-calendar';
import { ListToolbar } from '@shared/widgets/ui/list-toolbar';
import { Dropdown } from '@shared/adapters/ui/dropdown/dropdown';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { ConfirmDialog } from '@core/services/confirm-dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-schedules',
  standalone: true,
  imports: [CommonModule, ScheduleCalendarComponent, ListToolbar, Dropdown],
  templateUrl: './schedules.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SchedulesPage {
  private dialog = inject(DialogModalService);
  private store = inject(ScheduleStore);
  private permissionStore = inject(PermissionCheckStore);
  private confirmDialog = inject(ConfirmDialog);

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
    return list.filter(
      (s) =>
        s.title?.toLowerCase().includes(search) ||
        s.classroom?.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search),
    );
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
    this.store.loadAll();
  }

  editSchedule(schedule: Schedule) {
    this.openForm(schedule);
  }

  deleteSchedule(schedule: Schedule) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar horario',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${schedule.title}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', variant: 'solid' },
        rejectButtonProps: { label: 'Cancelar', variant: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) this.store.delete(schedule.id);
      });
  }

  openForm(current?: Schedule | null) {
    const ref = this.dialog.open(ScheduleForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '760px',
      maxHeight: '500px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
