import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { HeaderConfig } from '@core/types/header-types';
import { ActionConfig, ActionContext } from '@core/types/action-types';

import { Dropdown } from '@shared/ui/dropdown/dropdown';

@Component({
  selector: 'sga-header-detail',
  standalone: true,
  imports: [CommonModule, Dropdown],
  templateUrl: './header-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderDetail {
  private permissionStore = inject(PermissionCheckStore);

  // ================= INPUTS =================
  config = input<HeaderConfig>({});
  actions = input<ActionConfig[]>([]);
  selectedCount = input<number>(0);
  loading = input<boolean>(false);
  viewModeInput = input<'table' | 'kanban'>('table');

  // ================= OUTPUTS =================
  actionClick = output<{ action: ActionConfig; context: ActionContext }>();
  viewModeChange = output<'table' | 'kanban'>();
  refresh = output<void>();

  // ================= UI STATE =================
  viewMode = signal<'table' | 'kanban'>(this.viewModeInput());

  // ================= COMPUTED =================
  headerConfig = computed<HeaderConfig>(() => ({
    showFilters: true,
    showActions: true,
    showSelection: true,
    ...this.config(),
  }));

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.actions().filter((a) => a.typeAction === 'header')),
  );

  actionDropdownItems = computed(() =>
    this.headerActions().map((action) => ({
      label: action.label,
      icon: action.icon,
      disabled: this.isDisabled(action),
      action: () => this.emitAction(action),
    })),
  );

  // ================= ACTION EMIT =================
  private emitAction(action: ActionConfig): void {
    if (this.isDisabled(action)) return;

    this.actionClick.emit({
      action,
      context: {},
    });
  }

  private isDisabled(action: ActionConfig): boolean {
    return typeof action.disabled === 'function' ? action.disabled({}) : !!action.disabled;
  }

  // ================= VIEW =================
  toggleViewMode(): void {
    const mode = this.viewMode() === 'table' ? 'kanban' : 'table';
    this.viewMode.set(mode);
    this.viewModeChange.emit(mode);
  }

  onRefresh(): void {
    this.refresh.emit();
  }
}
