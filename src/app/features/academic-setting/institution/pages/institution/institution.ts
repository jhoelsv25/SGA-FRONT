import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActionConfig, ActionContext } from '@core/types/action-types';
import { DataSource } from '@shared/components/data-source/data-source';
import { HeaderDetail } from '@shared/components/header-detail/header-detail';
import { InstitutionStore } from '../../services/store/insittution.store';
import { Institution as InstitutionType } from '../../types/institution-types';
import { InstitutionForm } from '../../components/institution-form/institution-form';
@Component({
  selector: 'sga-institution',
  imports: [HeaderDetail, DataSource],
  templateUrl: './institution.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Institution {
  private dialog = inject(Dialog);
  private store = inject(InstitutionStore);

  headerConfig = computed(() => this.store.headerConfig());
  columns = computed(() => this.store.columns());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  pagination = computed(() => this.store.pagination());

  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));

  rowActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'row'));

  onHeaderAction(e: { action: ActionConfig; context: ActionContext }) {
    switch (e.action.key) {
      case 'create':
        // this.store.setCurrent(null);
        this.openForm();
        break;

      case 'refresh':
        this.onRefresh();
        break;
    }
  }

  onRowAction(e: { action: ActionConfig; context: ActionContext<unknown> }) {
    const row = e.context.row as InstitutionType;
    switch (e.action.key) {
      case 'edit':
        this.openForm(undefined, row);
        break;

      case 'delete':
        this.store.delete(row.id);
        break;
    }
  }

  onRefresh() {
    this.store.loadAll({
      page: this.pagination().page,
      size: this.pagination().size,
    });
  }

  // =========================
  // UI ONLY
  // =========================
  private openForm(title?: string, current: InstitutionType | null = null) {
    this.dialog.open(InstitutionForm, {
      data: {
        title: title ?? (current ? 'Editar institución' : 'Nueva institución'),
        subTitle: 'Administrar información de la institución',
        current,
      },
      panelClass: 'dialog-top',
      height: '90%',
      width: '700px',
    });
  }
}
