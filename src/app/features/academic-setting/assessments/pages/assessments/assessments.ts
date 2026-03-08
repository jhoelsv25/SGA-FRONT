import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { AssessmentStore } from '../../services/store/assessment.store';
import { ASSESSMENT_HEADER_CONFIG } from '../../config/header.config';
import { ASSESSMENT_COLUMNS } from '../../config/column.config';
import { ASSESSMENT_ACTIONS } from '../../config/action.config';
@Component({
  selector: 'sga-assessments',
  standalone: true,
  imports: [CommonModule, HeaderDetail, DataSource],
  templateUrl: './assessments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Assessments implements OnInit {
  private store = inject(AssessmentStore);

  headerConfig = computed(() => ASSESSMENT_HEADER_CONFIG);
  columns = computed(() => ASSESSMENT_COLUMNS);
  data = computed(() => this.store.assessments());
  loading = computed(() => this.store.loading());
  pagination = computed(() => ({
    page: 1,
    size: 50,
    total: this.store.assessments().length
  }));

  headerActions = computed(() => ASSESSMENT_ACTIONS.filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => ASSESSMENT_ACTIONS.filter((a) => a.typeAction === 'row'));

  ngOnInit() {
    this.store.loadAll({});
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRowAction() {
    // Implementation for edit/delete
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.loadAll({ page: p.page, size: p.size });
  }

  onRefresh() {
    this.store.loadAll({});
  }
}
