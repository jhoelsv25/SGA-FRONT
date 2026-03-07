import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ActionConfig, ActionContext } from '@core/types/action-types';
import { Dialog } from '@angular/cdk/dialog';
import { YearAcademicStore } from '../../services/store/year-academic.store';
import { YearAcademic } from '../../types/year-academi-types';
import { YearAcademicForm } from '../../components/year-academic-form/year-academic-form';
import { CommonModule } from '@angular/common';
import { YearAcademicCardComponent } from '../../components/year-academic-card/year-academic-card';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { PeriodForm } from '@features/academic-setup/periods/components/period-form/period-form';
import { ListToolbar } from '@shared/ui/list-toolbar';
import { Dropdown } from '@shared/ui/dropdown/dropdown';
import { Select } from '@shared/ui/select/select';
import { PermissionCheckStore } from '@core/stores/permission-check.store';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'planned', label: 'Planificado' },
  { value: 'ongoing', label: 'En curso' },
  { value: 'completed', label: 'Cerrado' },
  { value: 'cancelled', label: 'Cancelado' },
];

@Component({
  selector: 'sga-year-academic',
  standalone: true,
  imports: [CommonModule, YearAcademicCardComponent, EmptyState, Skeleton, ListToolbar, Dropdown, Select],
  templateUrl: './year-academic.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class YearAcademicComponent {
  private dialog = inject(Dialog);
  private store = inject(YearAcademicStore);
  private router = inject(Router);
  private permissionStore = inject(PermissionCheckStore);

  readonly skeletonItems = [1, 2, 3, 4];
  searchTerm = signal('');
  filterStatus = signal<string>('');

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());

  filteredData = computed(() => {
    const list = this.data();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.filterStatus();
    return list.filter((y) => {
      const matchSearch =
        !search ||
        y.name.toLowerCase().includes(search) ||
        String(y.year).includes(search);
      const matchStatus = !status || y.status === status;
      return matchSearch && matchStatus;
    });
  });

  filterCount = computed(() => (this.filterStatus() ? 1 : 0));

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  readonly statusOptions = STATUS_OPTIONS;

  onFilterStatus(value: unknown) {
    this.filterStatus.set(value != null ? String(value) : '');
  }

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

  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

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

  public goToDetail(year: YearAcademic) {
    this.router.navigate(['/academic-setup/years', year.id]);
  }

  public openPeriodForm(year: YearAcademic) {
    const ref = this.dialog.open(PeriodForm, {
      data: {
        yearAcademicId: year.id,
        yearAcademicName: year.name,
      },
      panelClass: 'dialog-top',
      width: '440px',
      maxHeight: '530px',
    });
    ref.closed.subscribe(() => this.onRefresh());
  }

  public createFromEmpty() {
    this.store.setCurrent(null);
    this.openForm();
  }

  public openForm() {
    const ref = this.dialog.open(YearAcademicForm, {
      data: {
        current: this.store.current(),
      },
      panelClass: 'dialog-top',
      width: '700px',
      maxHeight: '700px'
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
