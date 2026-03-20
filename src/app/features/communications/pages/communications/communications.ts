import { DialogModalService } from '@shared/widgets/dialog-modal';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { CommunicationStore } from '../../services/store/communication.store';
import { Communication } from '../../types/communication-types';
import { CommunicationForm } from '../../components/communication-form/communication-form';
import { CommunicationCardComponent } from '../../components/communication-card/communication-card';
import { Router } from '@angular/router';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';


@Component({
  selector: 'sga-communications',
  imports: [HeaderDetail, CommunicationCardComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './communications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CommunicationsPage {
  private dialog = inject(DialogModalService);
  private store = inject(CommunicationStore);
  private router = inject(Router);

  headerConfig = computed(() => this.store.headerConfig());
  data = computed(() => this.store.data());
  loading = computed(() => this.store.loading());
  headerActions = computed(() => this.store.actions().filter((a) => a.typeAction === 'header'));
  draftCount = computed(() => this.data().filter((item) => item.status === 'draft').length);
  scheduledCount = computed(() => this.data().filter((item) => item.status === 'scheduled').length);
  sentCount = computed(() => this.data().filter((item) => item.status === 'sent').length);
  failedCount = computed(() => this.data().filter((item) => item.status === 'failed').length);

  onHeaderAction(e: { action: { key: string } }) {
    if (e.action.key === 'create') this.openForm();
    if (e.action.key === 'refresh') this.store.loadAll();
  }

  viewDetail(communication: Communication) {
    this.router.navigate(['/communications', communication.id], {
      state: { communication },
    });
  }

  editCommunication(communication: Communication) {
    this.openForm(communication);
  }

  deleteCommunication(communication: Communication) {
    this.store.delete(communication.id);
  }

  private openForm(current?: Communication | null) {
    this.dialog.open(CommunicationForm, {
      data: { current: current ?? null },
      width: '520px',
      maxHeight: '80vh',
    });
  }
}
