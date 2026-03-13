import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/widgets/data-source/data-source';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { UserStore } from '../../services/store/user.store';
import { User } from '../types/user-types';
import { UserForm } from '../components/user-form/user-form';
import { USER_HEADER_CONFIG } from '../config/header.config';
import { USER_COLUMN } from '../config/column.config';
import { USER_ACTIONS } from '../config/action.config';

@Component({
  selector: 'sga-users',
  imports: [HeaderDetail, DataSource],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersPage {
  private dialog = inject(DialogModalService);
  private store = inject(UserStore);

  headerConfig = computed(() => USER_HEADER_CONFIG);
  columns = computed(() => USER_COLUMN);
  data = computed(() => this.store.users());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  headerActions = computed(() => USER_ACTIONS.filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => USER_ACTIONS.filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as User;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(String(row.id));
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.loadAll({ page: p.page, size: p.size });
  }

  private openForm(current?: User | null) {
    this.dialog.open(UserForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '520px',
    });
  }
}
