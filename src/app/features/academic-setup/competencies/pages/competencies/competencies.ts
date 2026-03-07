import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { CompetencyStore } from '../../services/store/competency.store';
import type { Competency } from '../../types/competency-types';
import { CompetencyForm } from '../../components/competency-form/competency-form';
import { CommonModule } from '@angular/common';
import { CompetencyCardComponent } from '../../components/competency-card/competency-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';

@Component({
  selector: 'sga-competencies',
  standalone: true,
  imports: [CommonModule, HeaderDetail, CompetencyCardComponent, EmptyState, Skeleton, ListToolbar],
  templateUrl: './competencies.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CompetenciesPage {
  private dialog = inject(Dialog);
  private store = inject(CompetencyStore);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');

  headerConfig = computed(() => this.store.headerConfig());
  data = computed(() => this.store.data());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    return list.filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search) ||
        (c.code?.toLowerCase().includes(search) ?? false),
    );
  });

  onSearch(value: string) {
    this.searchTerm.set(value);
  }
  loading = computed(() => this.store.loading());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.loadAll({});
  }

  editCompetency(competency: Competency) {
    this.openForm(competency);
  }

  deleteCompetency(competency: Competency) {
    if (confirm(`¿Eliminar la competencia "${competency.name}"?`)) {
      this.store.delete(competency.id).subscribe({
        next: () => this.onRefresh(),
      });
    }
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: Competency | null) {
    const ref = this.dialog.open(CompetencyForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
      maxHeight: '530px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
