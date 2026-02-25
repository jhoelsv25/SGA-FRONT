import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { CommunicationStore } from '../../services/store/communication.store';
import { Communication } from '../../types/communication-types';

@Component({
  selector: 'sga-communications',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './communications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CommunicationsPage {
  private store = inject(CommunicationStore);

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  pagination = computed(() => ({
    ...this.store.pagination(),
    total: this.store.data().length,
  }));
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') {
      // TODO: open form dialog
    }
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Communication;
    if (e.action.key === 'edit') {
      // TODO: open form dialog with row
    }
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
  }
}
