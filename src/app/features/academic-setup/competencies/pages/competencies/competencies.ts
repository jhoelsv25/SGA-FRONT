import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { ConfirmDialog } from '@core/services/confirm-dialog';
import { CompetencyStore } from '../../services/store/competency.store';
import type { Competency } from '../../types/competency-types';
import { CompetencyForm } from '../../components/competency-form/competency-form';
import { CommonModule } from '@angular/common';
import { CompetencyCardComponent } from '../../components/competency-card/competency-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';
import { Dropdown } from '@shared/ui/dropdown/dropdown';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

@Component({
  selector: 'sga-competencies',
  standalone: true,
  imports: [CommonModule, CompetencyCardComponent, EmptyState, Skeleton, ListToolbar, Dropdown],
  templateUrl: './competencies.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CompetenciesPage {
  private dialog = inject(Dialog);
  private confirmDialog = inject(ConfirmDialog);
  private store = inject(CompetencyStore);
  private permissionStore = inject(PermissionCheckStore);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');

  data = computed(() => this.store.data());

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  actionDropdownItems = computed(() =>
    this.headerActions().map((action) => ({
      label: action.label,
      icon: action.icon,
      disabled: typeof action.disabled === 'function' ? action.disabled({}) : !!action.disabled,
      action: () => this.onHeaderAction({ action, context: {} }),
    })),
  );

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
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar competencia',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${competency.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', variant: 'solid' },
        rejectButtonProps: { label: 'Cancelar', variant: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(competency.id).subscribe({
            next: () => this.onRefresh(),
          });
        }
      });
  }

  createFromEmpty() {
    this.openForm();
  }

  openForm(current?: Competency | null) {
    const ref = this.dialog.open(CompetencyForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '560px',
      maxHeight: '540px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
