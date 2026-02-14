import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { ModulesListStore } from '../../services/store/modules-list.store';

@Component({
  selector: 'sga-modules-list-page',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './modules-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ModulesListPage {
  private store = inject(ModulesListStore);

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  cursorPagination = computed(() => this.store.cursorPagination());
  headerActions = computed(() => this.store.actions());

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'refresh') {
      this.store.refresh();
    }
  }

  onLoadMore(cursor: string) {
    this.store.loadMore(cursor);
  }
}
