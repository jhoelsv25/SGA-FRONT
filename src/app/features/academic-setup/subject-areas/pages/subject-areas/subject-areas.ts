import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { SubjectAreaStore } from '../../services/store/subject-area.store';
import { SubjectArea } from '../../types/subject-area-types';
import { SubjectAreaForm } from '../../components/subject-area-form/subject-area-form';
import { CommonModule } from '@angular/common';
import { SubjectAreaCardComponent } from '../../components/subject-area-card/subject-area-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';

@Component({
  selector: 'sga-subject-areas',
  standalone: true,
  imports: [CommonModule, HeaderDetail, SubjectAreaCardComponent, EmptyState, Skeleton, ListToolbar],
  templateUrl: './subject-areas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SubjectAreasPage {
  private dialog = inject(Dialog);
  private store = inject(SubjectAreaStore);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');
  filterType = signal<string>('');

  headerConfig = computed(() => this.store.headerConfig());
  data = computed(() => this.store.data());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const type = this.filterType();
    return list.filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search) ||
        (a.code?.toLowerCase().includes(search) ?? false);
      const matchType = !type || a.type === type;
      return matchSearch && matchType;
    });
  });

  filterCount = computed(() => (this.filterType() ? 1 : 0));

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onFilterType(event: Event) {
    this.filterType.set((event.target as HTMLSelectElement).value);
  }
  loading = computed(() => this.store.loading());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.load({});
  }

  editSubjectArea(area: SubjectArea) {
    this.openForm(area);
  }

  deleteSubjectArea(area: SubjectArea) {
    if (confirm(`¿Eliminar el área "${area.name}"?`)) {
      this.store.delete(area.id);
    }
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: SubjectArea | null) {
    const ref = this.dialog.open(SubjectAreaForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '520px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
