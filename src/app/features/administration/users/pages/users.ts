import { DialogModalService } from '@shared/widgets/dialog-modal';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/widgets/data-source/data-source';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { UserStore } from '../../services/store/user.store';
import { User } from '../types/user-types';
import { UserForm } from '../components/user-form/user-form';
import { USER_HEADER_CONFIG } from '../config/header.config';
import { USER_COLUMN } from '../config/column.config';
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
  imports: [HeaderDetail, DataSource, FormsModule, ZardInputDirective, ZardButtonComponent, SelectOptionComponent, ...ZardFormImports],
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

  public filterSearch = signal('');
  public filterRole = signal('');
  public hasActiveFilters = computed(() => !!this.filterSearch() || !!this.filterRole());
  
  // Asumiendo que pueden haber roles fijos de prueba o se filtrarán luego
  public rolesFilter = [
    { value: '', label: 'Todos' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'student', label: 'Estudiante' }
  ];

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      this.filterSearch.set(params['search'] || '');
      this.filterRole.set(params['role'] || '');
      this.store.loadAll({
        page: this.store.pagination().page,
        size: this.store.pagination().size,
        ...params
      });
    });
  }

  headerConfig = computed(() => USER_HEADER_CONFIG);
  columns = computed(() => USER_COLUMN);
  data = computed(() => this.store.users());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());
  headerActions = computed(() => USER_ACTIONS.filter((a) => a.typeAction === 'header'));
  rowActions = computed(() => USER_ACTIONS.filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'import') this.router.navigate(['/administration/users/import']);
    if (e.action.key === 'refresh')
      this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
  }

  async onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as User;
    if (e.action.key === 'edit') this.openForm(row);
    if (e.action.key === 'delete') {
      const confirmed = await this.confirmDialog.open({
        type: 'danger',
        icon: 'fa-solid fa-triangle-exclamation',
        title: 'Eliminar usuario',
        message: `¿Estás seguro de eliminar al usuario ${row.firstName} ${row.lastName}? Esta acción no se puede deshacer.`,
        acceptButtonProps: { label: 'Eliminar', color: 'danger' },
        rejectButtonProps: { label: 'Cancelar', color: 'secondary' }
      });

      if (confirmed) {
        this.store.delete(String(row.id));
      }
    }
  }

  onPageChange(p: { page: number; size: number }) {
    this.store.loadAll({ page: p.page, size: p.size });
  }

  ngOnInit() {
    // La carga inicial y las actualizaciones se manejan en el constructor reactivamente vía URL
  }

  applyFilters() {
    this.urlParams.setParams({
      search: this.filterSearch(),
      role: this.filterRole()
    });
  }

  clearFilters() {
    this.urlParams.clearParams();
  }

  private openForm(current?: User | null) {
    const ref = this.dialog.open(UserForm, {
      data: { current: current ?? null },
      panelClass: 'dialog-top',
      width: '520px',
    });
    ref.closed.pipe(take(1)).subscribe(() => {
      this.store.loadAll({ page: this.pagination().page, size: this.pagination().size });
    });
  }
}
