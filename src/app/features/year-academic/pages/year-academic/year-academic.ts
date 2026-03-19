import { HeaderDetail } from '@/shared/widgets/header-detail/header-detail';
import { SelectOptionComponent, SelectOption } from '@/shared/widgets/select-option/select-option';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { YearAcademicStore } from '../../services/store/year-academic.store';
import { YearAcademic } from '../../types/year-academi-types';
import { YearAcademicForm } from '../../components/year-academic-form/year-academic-form';
import { CommonModule } from '@angular/common';
import { YearAcademicCardComponent } from '../../components/year-academic-card/year-academic-card';
import { PeriodForm } from '@features/periods/components/period-form/period-form';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardFormImports } from '@/shared/components/form';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'planned', label: 'Planificado' },
  { value: 'ongoing', label: 'En curso' },
  { value: 'completed', label: 'Cerrado' },
  { value: 'cancelled', label: 'Cancelado' }];


@Component({
  selector: 'sga-year-academic',
  standalone: true,
  imports: [CommonModule, HeaderDetail, YearAcademicCardComponent, ZardEmptyComponent, ZardSkeletonComponent, SelectOptionComponent, FormsModule, ZardInputDirective, ZardButtonComponent, ...ZardFormImports],
  templateUrl: './year-academic.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class YearAcademicComponent {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(DialogConfirmService);
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
  readonly canManageAcademicYears = computed(() => this.permissionStore.has('manage_academic_year'));
  readonly canManageAcademicPeriods = computed(() => this.permissionStore.has('manage_academic_period'));
  readonly hasActiveFilters = computed(() => !!this.searchTerm().trim() || !!this.filterStatus());

  onFilterStatus(value: unknown) {
    this.filterStatus.set(value != null ? String(value) : '');
  }

  headerActions = computed(() =>
    this.permissionStore.filterActions(this.store.actions().filter((a) => a.typeAction === 'header')),
  );

  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  clearFilters() {
    this.searchTerm.set('');
    this.filterStatus.set('');
  }

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
        this.deleteYear(row);
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
    this.confirmDialog
      .open({
        type: 'danger',
        title: 'Eliminar año académico',
        icon: 'fa-solid fa-trash',
        message: `¿Estás seguro de eliminar "${year.name}"? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger', zType: 'default' },
        rejectButtonProps: { label: 'Cancelar', zType: 'outline' },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.store.delete(year.id);
        }
      });
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
    if (!this.canManageAcademicYears()) return;
    this.store.setCurrent(null);
    this.openForm();
  }

  public openForm() {
    if (!this.canManageAcademicYears()) return;
    const ref = this.dialog.open(YearAcademicForm, {
      data: {
        current: this.store.current(),
      },
      panelClass: 'dialog-top',
      width: '800px',
      maxHeight: '700px'
    });
    ref.closed.subscribe(() => this.onRefresh());
  }
}
