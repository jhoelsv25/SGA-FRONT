import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { HeaderDetail } from '@shared/components/header-detail/header-detail';

import { ActionConfig, ActionContext } from '@core/types/action-types';
import { Dialog } from '@angular/cdk/dialog';
import { YearAcademicStore } from '../../services/store/year-academic.store';
import { YearAcademic } from '../../types/year-academi-types';
import { YearAcademicForm } from '../../components/year-academic-form/year-academic-form';
import { CommonModule } from '@angular/common';
import { YearAcademicCardComponent } from '../../components/year-academic-card/year-academic-card';
@Component({
  selector: 'sga-year-academic',
  standalone: true,
  imports: [CommonModule, HeaderDetail, YearAcademicCardComponent],
  templateUrl: './year-academic.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class YearAcademicComponent {
  private dialog = inject(Dialog);
  private store = inject(YearAcademicStore);

  // =========================
  // STATE (FROM STORE)
  // =========================
  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());

  // =========================
  // ACTIONS
  // =========================
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  // =========================
  // HANDLERS
  // =========================
  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    switch (e.action.key) {
      case 'create':
        this.store.setCurrent(null);
        this.openForm();
        break;

      case 'refresh':
        this.onRefresh();
        break;
    }
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as YearAcademic;
    switch (e.action.key) {
      case 'edit':
        this.store.setCurrent(row);
        this.openForm();
        break;

      case 'delete':
        this.store.delete(row.id);
        break;
    }
  }

  onSelectionChange(rows: unknown[]) {
    this.store.setSelected(rows as YearAcademic[]);
  }

  public onRefresh() {
    this.store.load({
      page: this.pagination().page,
      size: this.pagination().size,
    });
  }

  public editYear(year: YearAcademic) {
    this.store.setCurrent(year);
    this.openForm();
  }

  public deleteYear(year: YearAcademic) {
    if (confirm(`¿Estás seguro de eliminar el año académico ${year.name}?`)) {
      this.store.delete(year.id);
    }
  }

  // =========================
  // UI ONLY
  // =========================
  public openForm() {
    this.dialog.open(YearAcademicForm, {
      data: {
        current: this.store.current(),
      },
      panelClass: 'dialog-top',
      width: '700px',
    });
  }
}
