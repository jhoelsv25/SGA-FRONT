import { ZardEmptyComponent } from '@/shared/components/empty';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { DialogConfirmService } from '@shared/widgets/dialog-confirm';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { InstitutionStore } from '@features/admin-services/store/institution.store';
import { Institution as InstitutionType, InstitutionStatus, INSTITUTION_STATUS_LABELS } from '../../types/institution-types';
import { InstitutionForm } from '../../components/institution-form/institution-form';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstitutionCardComponent } from '../../components/institution-card/institution-card';
import { InstitutionSkeleton } from '../../components/institution-skeleton/institution-skeleton';
import { ActionConfig, ActionContext } from '@core/types/action-types';

import { UrlParamsService } from '@core/services/url-params.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ZardInputDirective } from '@/shared/components/input';
import { ZardButtonComponent } from '@/shared/components/button';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ZardFormImports } from '@/shared/components/form';

@Component({
  selector: 'sga-institution',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderDetail, InstitutionCardComponent, InstitutionSkeleton, ZardEmptyComponent, ZardInputDirective, ZardButtonComponent, SelectOptionComponent, ...ZardFormImports],
  templateUrl: './institution.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Institution {
  private dialog = inject(DialogModalService);
  private confirmDialog = inject(DialogConfirmService);
  public store = inject(InstitutionStore);
  private urlParams = inject(UrlParamsService);
  private route = inject(ActivatedRoute);

  public filterStatus = signal('');
  public filterSearch = signal('');
  public hasActiveFilters = computed(() => !!this.filterSearch() || !!this.filterStatus());

  public statuses = [
    { value: '', label: 'Todos' },
    { value: InstitutionStatus.ACTIVE, label: INSTITUTION_STATUS_LABELS[InstitutionStatus.ACTIVE] },
    { value: InstitutionStatus.INACTIVE, label: INSTITUTION_STATUS_LABELS[InstitutionStatus.INACTIVE] },
    { value: InstitutionStatus.CLOSED, label: INSTITUTION_STATUS_LABELS[InstitutionStatus.CLOSED] }
  ];

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      this.filterStatus.set(params['status'] || '');
      this.filterSearch.set(params['search'] || '');
      this.store.loadAll({
        page: this.store.pagination().page,
        size: this.store.pagination().size,
        ...params
      });
    });
  }

  headerConfig = computed(() => this.store.headerConfig());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());

  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    switch (e.action.key) {
      case 'create':
        this.openForm();
        break;
      case 'refresh':
        this.onRefresh();
        break;
    }
  }

  onRefresh() {
    this.store.loadAll({
      page: this.pagination().page,
      size: this.pagination().size,
      ...this.urlParams.getAllParams()
    });
  }

  applyFilters() {
    this.urlParams.setParams({
      status: this.filterStatus(),
      search: this.filterSearch()
    });
  }

  clearFilters() {
    this.urlParams.clearParams();
  }

  public openForm(title?: string, current: InstitutionType | null = null) {
    this.dialog.open(InstitutionForm, {
      data: {
        title: title ?? (current ? 'Editar institución' : 'Nueva institución'),
        subTitle: 'Administrar información de la institución',
        current,
      },
      panelClass: 'dialog-top',
      width: '900px',
    });
  }

  public async deleteInstitution(id: string) {
    const confirmed = await this.confirmDialog.open({
      type: 'danger',
      icon: 'fa-solid fa-triangle-exclamation',
      title: 'Eliminar institución',
      message: '¿Estás seguro de eliminar esta institución? Esta acción no se puede deshacer.',
      acceptButtonProps: { label: 'Eliminar', color: 'danger' },
      rejectButtonProps: { label: 'Cancelar', color: 'secondary' }
    });

    if (confirmed) {
      this.store.delete(id);
    }
  }

  public updateStatus(id: string, status: string) {
    this.store.update(id, { status }).subscribe();
  }
}
