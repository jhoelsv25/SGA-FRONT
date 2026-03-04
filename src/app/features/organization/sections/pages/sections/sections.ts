import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { SectionStore } from '../../services/store/section.store';
import type { Section } from '../../types/section-types';
import { SectionForm } from '../../components/section-form/section-form';
import { CommonModule } from '@angular/common';
import { SectionCardComponent } from '../../components/section-card/section-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';

@Component({
  selector: 'sga-sections',
  standalone: true,
  imports: [CommonModule, HeaderDetail, SectionCardComponent, EmptyState, Skeleton],
  templateUrl: './sections.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SectionsPage {
  private dialog = inject(Dialog);
  private store = inject(SectionStore);

  readonly skeletonItems = [1, 2, 3, 4];

  headerConfig = computed(() => this.store.headerConfig());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onRefresh() {
    this.store.loadAll();
  }

  editSection(section: Section) {
    this.openForm(section);
  }

  deleteSection(section: Section) {
    if (confirm(`¿Eliminar la sección "${section.name}"?`)) {
      this.store.delete(section.id);
    }
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: Section | null) {
    const ref = this.dialog.open(SectionForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '600px',
      maxHeight: '530px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
