import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { InstitutionStore } from '../../../services/store/institution.store';
import { Institution as InstitutionType } from '../../types/institution-types';
import { InstitutionForm } from '../../components/institution-form/institution-form';
import { CommonModule } from '@angular/common';
import { InstitutionCardComponent } from '../../components/institution-card/institution-card';
import { InstitutionSkeleton } from '../../components/institution-skeleton/institution-skeleton';
import { EmptyState } from '@shared/widgets/ui/empty-state/empty-state';
import { ActionConfig, ActionContext } from '@core/types/action-types';

@Component({
  selector: 'sga-institution',
  standalone: true,
  imports: [CommonModule, HeaderDetail, InstitutionCardComponent, InstitutionSkeleton, EmptyState],
  templateUrl: './institution.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Institution {
  private dialog = inject(DialogModalService);
  public store = inject(InstitutionStore);

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
    });
  }

  public openForm(title?: string, current: InstitutionType | null = null) {
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

  public deleteInstitution(id: string) {
    if (confirm('¿Estás seguro de eliminar esta institución?')) {
      this.store.delete(id);
    }
  }
}
