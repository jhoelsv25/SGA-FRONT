import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { SectionStore } from '../../services/store/section.store';
import type { Section } from '../../types/section-types';
import { SectionForm } from '../../components/section-form/section-form';
import { CommonModule } from '@angular/common';
import { SectionCardComponent } from '../../components/section-card/section-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ListToolbar } from '@shared/ui/list-toolbar';
import { Dropdown } from '@shared/ui/dropdown/dropdown';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { ConfirmDialog } from '@core/services/confirm-dialog';

@Component({
  selector: 'sga-sections',
  standalone: true,
  imports: [CommonModule, SectionCardComponent, EmptyState, Skeleton, ListToolbar, Dropdown],
  templateUrl: './sections.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SectionsPage implements OnInit {
  private dialog = inject(Dialog);
  private store = inject(SectionStore);
  private route = inject(ActivatedRoute);
  private permissionStore = inject(PermissionCheckStore);
  private confirmDialog = inject(ConfirmDialog);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');

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

  data = computed(() => this.store.data());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return list;
    return list.filter((s) => s.name?.toLowerCase().includes(search));
  });

  loading = computed(() => this.store.loading());

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.store.loadAll(params);
    });
  }

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.onRefresh();
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onRefresh() {
    this.store.loadAll(this.route.snapshot.queryParams);
  }

  editSection(section: Section) {
    this.openForm(section);
  }

  deleteSection(section: Section) {
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar sección',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar la sección "${section.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', variant: 'solid' },
        rejectButtonProps: { label: 'Cancelar', variant: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(section.id);
        }
      });
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
