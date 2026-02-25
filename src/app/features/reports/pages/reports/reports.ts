import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { ReportStore } from '../../services/store/report.store';
import { Report } from '../../types/report-types';

@Component({
  selector: 'sga-reports',
  standalone: true,
  imports: [HeaderDetail, DataSource],
  templateUrl: './reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ReportsPage {
  private store = inject(ReportStore);

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
    if (e.action.key === 'generate') {
      // TODO: open generate report dialog
    }
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Report;
    if (e.action.key === 'download' && row.downloadUrl) {
      window.open(row.downloadUrl, '_blank');
    }
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
  }
}
