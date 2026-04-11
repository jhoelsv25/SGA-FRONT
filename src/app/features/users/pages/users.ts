import { DialogModalService } from '@shared/widgets/dialog-modal';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { PermissionCheckStore } from '@core/stores/permission-check.store';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { UserStore } from '@features/admin-services/store/user.store';
import { User } from '../types/user-types';
import { UserForm } from '../components/user-form/user-form';
import { UserExportModal } from '../components/user-export-modal/user-export-modal';
import {
  UserDatePreset,
  UserDateRangeFilterComponent,
} from '../components/user-date-range-filter/user-date-range-filter';
import { UsersTableComponent } from '../components/users-table/users-table';
import { USER_HEADER_CONFIG } from '../config/header.config';
import { USER_ACTIONS } from '../config/action.config';
import { take } from 'rxjs';

import { UrlParamsService } from '@core/services/url-params.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardFormImports } from '@/shared/components/form';

@Component({
  selector: 'sga-users',
  imports: [
    HeaderDetail,
    UsersTableComponent,
    FormsModule,
    ZardInputDirective,
    ZardButtonComponent,
    SelectOptionComponent,
    UserDateRangeFilterComponent,
    ...ZardFormImports,
  ],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class UsersPage implements OnInit {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(DialogConfirmService);
  private store = inject(UserStore);
  private router = inject(Router);
  private urlParams = inject(UrlParamsService);
  private route = inject(ActivatedRoute);
  private permissionStore = inject(PermissionCheckStore);

  public filterSearch = signal('');
  public filterRole = signal('');
  public filterDatePreset = signal<UserDatePreset>('');
  public filterCreatedFrom = signal<Date | null>(null);
  public filterCreatedTo = signal<Date | null>(null);
  public hasActiveFilters = computed(
    () =>
      !!this.filterSearch() ||
      !!this.filterRole() ||
      !!this.filterDatePreset() ||
      !!this.filterCreatedFrom() ||
      !!this.filterCreatedTo(),
  );

  public rolesFilter = [
    { value: '', label: 'Todos' },
    { value: 'Super Admin', label: 'Super Admin' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Director', label: 'Director' },
    { value: 'Docente', label: 'Docente' },
    { value: 'Estudiante', label: 'Estudiante' },
  ];

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.filterSearch.set(params['search'] || '');
      this.filterRole.set(params['roleName'] || '');
      this.filterDatePreset.set((params['datePreset'] || '') as UserDatePreset);
      this.filterCreatedFrom.set(this.parseDateParam(params['createdFrom']));
      this.filterCreatedTo.set(this.parseDateParam(params['createdTo']));
      this.store.loadAll({
        limit: this.store.pagination().limit,
        ...params,
      });
    });
  }

  headerConfig = computed(() => USER_HEADER_CONFIG);
  data = computed(() => this.store.users());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  headerActions = computed(() =>
    this.permissionStore.filterActions(USER_ACTIONS.filter((a) => a.typeAction === 'header')),
  );
  rowActions = computed(() =>
    this.permissionStore.filterActions(USER_ACTIONS.filter((a) => a.typeAction === 'row')),
  );

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'import') this.router.navigate(['/administration/users/import']);
    if (e.action.key === 'export') this.openExportModal();
    if (e.action.key === 'sessions-global') this.router.navigate(['/administration/sessions']);
    if (e.action.key === 'refresh')
      this.store.loadAll({ limit: this.pagination().limit, ...this.urlParams.getAllParams() });
  }

  async onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as User;
    if (e.action.key === 'sessions')
      this.router.navigate(['/administration/users', row.id, 'sessions']);
    if (e.action.key === 'toggle-active') {
      this.store.update(row.id, { isActive: !row.isActive }).subscribe();
    }
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') {
      const confirmed = await this.confirmDialog.open({
        type: 'danger',
        icon: 'fa-solid fa-triangle-exclamation',
        title: 'Eliminar usuario',
        message: `¿Estás seguro de eliminar al usuario ${row.firstName} ${row.lastName}? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger' },
        rejectButtonProps: { label: 'Cancelar', color: 'secondary' },
      });

      if (confirmed) {
        this.store.delete(String(row.id));
      }
    }
  }

  onPageChange(p: { page: number; size: number }) {
    // Para cambiar sólo de tamaño de página o offset retrocompatible si se usa
    this.store.loadAll({ limit: p.size, ...this.urlParams.getAllParams() });
  }

  onLoadMore(cursor: string) {
    this.store.loadAll({
      cursor,
      limit: this.pagination().limit,
      ...this.urlParams.getAllParams(),
    });
  }

  ngOnInit() {
    // La carga inicial y las actualizaciones se manejan en el constructor reactivamente vía URL
  }

  applyFilters() {
    this.urlParams.setParams({
      search: this.filterSearch(),
      roleName: this.filterRole(),
      datePreset: this.filterDatePreset(),
      createdFrom: this.toIsoDate(this.filterCreatedFrom()),
      createdTo: this.toIsoDate(this.filterCreatedTo()),
    });
  }

  clearFilters() {
    this.filterSearch.set('');
    this.filterRole.set('');
    this.filterDatePreset.set('');
    this.filterCreatedFrom.set(null);
    this.filterCreatedTo.set(null);
    this.urlParams.clearParams();
  }

  onDateRangeChange(range: { preset: UserDatePreset; from: Date | null; to: Date | null }) {
    this.filterDatePreset.set(range.preset);
    this.filterCreatedFrom.set(range.from);
    this.filterCreatedTo.set(range.to);
  }

  private openForm(current?: User | null) {
    const ref = this.dialog.open(UserForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '520px',
    });
    ref.closed.pipe(take(1)).subscribe(() => {
      this.store.loadAll({ limit: this.pagination().limit, ...this.urlParams.getAllParams() });
    });
  }

  private openExportModal() {
    this.dialog.open(UserExportModal, {
      data: {
        filterSearch: this.filterSearch(),
        filterRole: this.filterRole(),
      },
      panelClass: 'dialog-top',
      width: '600px',
    });
  }

  private parseDateParam(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toIsoDate(value: Date | null): string | null {
    if (!value) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
