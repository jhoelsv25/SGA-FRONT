import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { GradeLevelStore } from '../../services/store/grade-level.store';
import { GradeLevel } from '../../types/grade-level-types';
import { GradeLevelForm } from '../../components/grade-level-form/grade-level-form';
import { CommonModule } from '@angular/common';
import { GradeLevelCardComponent } from '../../components/grade-level-card/grade-level-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';

@Component({
  selector: 'sga-grade-levels',
  standalone: true,
  imports: [CommonModule, HeaderDetail, GradeLevelCardComponent, EmptyState, Skeleton, ListToolbar],
  templateUrl: './grade-levels.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GradeLevelsPage {
  private dialog = inject(Dialog);
  private store = inject(GradeLevelStore);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');
  filterLevel = signal<string>('');

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => this.store.data());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const level = this.filterLevel();
    return list.filter((g) => {
      const matchSearch = !search || g.name.toLowerCase().includes(search);
      const matchLevel = !level || g.level === level;
      return matchSearch && matchLevel;
    });
  });

  filterCount = computed(() => (this.filterLevel() ? 1 : 0));

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterLevel(event: Event) {
    this.filterLevel.set((event.target as HTMLSelectElement).value);
  }
  loading = computed(() => this.store.loading());
  pagination = computed(() => ({
    ...this.store.pagination(),
    total: this.store.data().length,
  }));
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.loadAll();
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as GradeLevel;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') this.store.delete(row.id);
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.setPagination(p.page, p.size);
  }

  editGradeLevel(gradeLevel: GradeLevel) {
    this.openForm(gradeLevel);
  }

  deleteGradeLevel(gradeLevel: GradeLevel) {
    if (confirm(`¿Eliminar el nivel "${gradeLevel.name}"?`)) {
      this.store.delete(gradeLevel.id);
    }
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: GradeLevel | null) {
    const ref = this.dialog.open(GradeLevelForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
      maxHeight: '500px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
