import { ListToolbarComponent } from '@/shared/widgets/list-toolbar/list-toolbar';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardButtonComponent } from '@/shared/components/button';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/widgets/data-source/data-source';

import { BehaviorStore } from '../../services/store/behavior.store';
import { Behavior } from '../../types/behavior-types';
import { BehaviorForm } from '../../components/behavior-form/behavior-form';
import { UiFiltersService } from '@core/services/ui-filters.service';


@Component({
  selector: 'sga-behaviors',
  imports: [CommonModule, SelectOptionComponent, DataSource, ZardButtonComponent, ListToolbarComponent],
  templateUrl: './behaviors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BehaviorsPage {
  private dialog = inject(DialogModalService);
  private store = inject(BehaviorStore);
  public readonly filters = inject(UiFiltersService);

  columns = computed(() => this.store.columns());
  data = computed(() => {
    const search = this.filters.behaviorSearch().toLowerCase();
    const type = this.filters.behaviorType();
    const severity = this.filters.behaviorSeverity();

    return this.store.data().filter((row) => {
      const matchesSearch =
        !search ||
        row.description?.toLowerCase().includes(search) ||
        row.studentName?.toLowerCase().includes(search) ||
        row.recordedBy?.toLowerCase().includes(search);
      const matchesType = !type || row.type === type;
      const matchesSeverity = !severity || row.severity === severity;
      return matchesSearch && matchesType && matchesSeverity;
    });
  });
  loading = computed(() => this.store.loading());
  pagination = computed(() => ({
    ...this.store.pagination(),
    total: this.data().length,
  }));
  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));
  activeFiltersCount = computed(() =>
    [this.filters.behaviorSearch(), this.filters.behaviorType(), this.filters.behaviorSeverity()].filter(Boolean)
      .length
  );

  typeOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos' },
    { value: 'incident', label: 'Incidente' },
    { value: 'achievement', label: 'Logro' },
    { value: 'observation', label: 'Observación' },
    { value: 'other', label: 'Otro' }]);

  severityOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todas' },
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' }]);

  onSearch(value: string): void {
    this.filters.setBehaviorSearch(value);
  }

  onTypeChange(value: unknown): void {
    this.filters.setBehaviorType(String(value ?? ''));
  }

  onSeverityChange(value: unknown): void {
    this.filters.setBehaviorSeverity(String(value ?? ''));
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as Behavior;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
  }

  onRefresh(): void {
    this.store.loadAll();
  }

  clearFilters(): void {
    this.filters.clearBehaviorFilters();
  }

  openCreate(): void {
    this.openForm();
  }

  private openForm(current?: Behavior | null) {
    this.dialog.open(BehaviorForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '480px',
    });
  }
}
