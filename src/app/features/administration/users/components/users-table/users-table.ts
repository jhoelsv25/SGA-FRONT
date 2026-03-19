import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { CursorPagination } from '@core/types/pagination-types';
import { User } from '../../types/user-types';
import { DropdownItem, DropdownOptionComponent } from '@/shared/widgets/dropdown-option/dropdown-option';
import { ZardEmptyComponent } from '@/shared/components/empty';

@Component({
  selector: 'sga-users-table',
  standalone: true,
  imports: [CommonModule, DatePipe, DropdownOptionComponent, ZardEmptyComponent],
  templateUrl: './users-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersTableComponent {
  readonly users = input<User[]>([]);
  readonly actions = input<ActionConfig[]>([]);
  readonly loading = input(false);
  readonly pagination = input<CursorPagination | undefined>();

  readonly actionClick = output<{ action: ActionConfig; context: ActionContext<User> }>();
  readonly loadMore = output<string>();

  onScroll(event: Event): void {
    if (this.loading()) return;

    const pagination = this.pagination();
    if (!pagination?.hasNext || !pagination.nextCursor) return;

    const target = event.target as HTMLElement;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceToBottom <= 120) {
      this.loadMore.emit(pagination.nextCursor);
    }
  }

  getDropdownItems(user: User): DropdownItem[] {
    return this.actions().map((action) => ({
      label: this.getActionLabel(action, user),
      icon: action.icon,
      action: () =>
        this.actionClick.emit({
          action,
          context: { row: user, selected: [] },
        }),
    }));
  }

  getActionLabel(action: ActionConfig, user: User): string {
    if (action.key === 'toggle-active') {
      return user.isActive ? 'Desactivar' : 'Activar';
    }
    return action.label;
  }
}
