import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { ZardButtonComponent } from '@/shared/components/button';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/widgets/data-source/data-source';
import { AssessmentStore } from '../../services/store/assessment.store';
import { ASSESSMENT_COLUMNS } from '../../config/column.config';
import { ASSESSMENT_ACTIONS } from '../../config/action.config';
import { AssessmentFiltersService } from '../../services/assessment-filters.service';

@Component({
  selector: 'sga-assessments',
  standalone: true,
  imports: [CommonModule, ListToolbarComponent, DataSource, ZardButtonComponent],
  templateUrl: './assessments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Assessments implements OnInit {
  private readonly store = inject(AssessmentStore);
  private readonly filters = inject(AssessmentFiltersService);

  columns = computed(() => ASSESSMENT_COLUMNS);
  data = computed(() => this.store.assessments());
  loading = computed(() => this.store.loading());
  pagination = computed(() => ({
    page: 1,
    size: 50,
    total: this.store.assessments().length
  }));

  rowActions = computed(() => ASSESSMENT_ACTIONS.filter((a) => a.typeAction === 'row'));
  totalAssessments = computed(() => this.data().length);
  hasListSearch = computed(() => Boolean(this.filters.listSearch()));

  ngOnInit() {
    this.store.loadAll({ search: this.filters.listSearch() });
  }

  onSearch(value: string): void {
    this.filters.setListSearch(value);
    this.store.loadAll({ search: this.filters.listSearch() });
  }

  onCreate(): void {
    // Placeholder para próxima implementación de modal/formulario
  }

  clearFilters(): void {
    this.filters.clearListFilters();
    this.store.loadAll({});
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'refresh') {
      this.onRefresh();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRowAction(e: { action: ActionConfig; context: ActionContext }) {
    // TODO: implementar acciones
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.loadAll({ page: p.page, size: p.size });
  }

  onRefresh() {
    this.store.loadAll({ search: this.filters.listSearch() });
  }
}
