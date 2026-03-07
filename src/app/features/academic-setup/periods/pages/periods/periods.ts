import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { PeriodStore } from '../../services/store/period.store';
import type { Period } from '../../types/period-types';
import { PeriodForm } from '../../components/period-form/period-form';
import { PeriodCardComponent } from '../../components/period-card/period-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';

@Component({
  selector: 'sga-periods',
  standalone: true,
  imports: [CommonModule, HeaderDetail, PeriodCardComponent, EmptyState, Skeleton, ListToolbar],
  templateUrl: './periods.html',
  styleUrls: ['./periods.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PeriodsComponent {
  private dialog = inject(Dialog);
  private store = inject(PeriodStore);

  headerConfig = computed(() => this.store.headerConfig());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  data = computed(() => this.store.periods());
  loading = computed(() => this.store.loading());
  readonly skeletonItems = [1, 2, 3, 4];

  searchTerm = signal('');
  filterStatus = signal<string>('');

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.filterStatus();
    return list.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search);
      const matchStatus = !status || p.status === status;
      return matchSearch && matchStatus;
    });
  });

  filterCount = computed(() => (this.filterStatus() ? 1 : 0));

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterStatus(event: Event) {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }): void {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh(): void {
    this.store.loadAll();
  }

  editPeriod(period: Period): void {
    this.openForm(period);
  }

  deletePeriod(period: Period): void {
    if (confirm(`¿Estás seguro de eliminar el período "${period.name}"?`)) {
      this.store.delete(period.id);
    }
  }

  createFromEmpty(): void {
    this.openForm();
  }

  private openForm(current?: Period | null): void {
    const ref = this.dialog.open(PeriodForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '500px',
      maxHeight: '500px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
