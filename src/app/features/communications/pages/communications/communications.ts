import { DialogModalService } from '@shared/widgets/dialog-modal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HeaderDetail } from '@shared/widgets/header-detail/header-detail';
import { CommunicationStore } from '../../services/store/communication.store';
import { Communication } from '../../types/communication-types';
import { CommunicationForm } from '../../components/communication-form/communication-form';
import { CommunicationCardComponent } from '../../components/communication-card/communication-card';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { NotificationApi } from '@core/services/api/notification-api';
import { HeaderConfig } from '@core/types/header-types';

@Component({
  selector: 'sga-communications',
  imports: [HeaderDetail, CommunicationCardComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './communications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CommunicationsPage implements OnInit {
  private dialog = inject(DialogModalService);
  private store = inject(CommunicationStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationApi = inject(NotificationApi);

  readonly mode = signal<'announcements' | 'notifications' | 'email-logs'>('announcements');
  readonly notificationData = signal<Communication[]>([]);
  readonly notificationLoading = signal(false);

  headerConfig = computed<HeaderConfig>(() => {
    switch (this.mode()) {
      case 'notifications':
        return {
          title: 'Notificaciones',
          subtitle: 'Alertas e historial del sistema para tu cuenta',
          showActions: true,
          showFilters: true,
        };
      case 'email-logs':
        return {
          title: 'Historial de Emails',
          subtitle: 'Registro de correos y entregas',
          showActions: true,
          showFilters: true,
        };
      default:
        return this.store.headerConfig();
    }
  });
  data = computed(() =>
    this.mode() === 'announcements' ? this.store.data() : this.notificationData(),
  );
  loading = computed(() =>
    this.mode() === 'announcements' ? this.store.loading() : this.notificationLoading(),
  );
  headerActions = computed(() => {
    if (this.mode() === 'announcements') {
      return this.store.actions().filter((a) => a.typeAction === 'header');
    }
    return this.store.actions().filter((a) => a.typeAction === 'header' && a.key === 'refresh');
  });
  draftCount = computed(() => this.data().filter((item) => item.status === 'draft').length);
  scheduledCount = computed(() => this.data().filter((item) => item.status === 'scheduled').length);
  sentCount = computed(
    () => this.data().filter((item) => ['sent', 'read'].includes(item.status)).length,
  );
  failedCount = computed(() => this.data().filter((item) => item.status === 'failed').length);
  unreadCount = computed(() => this.data().filter((item) => item.status === 'unread').length);
  readCount = computed(() => this.data().filter((item) => item.status === 'read').length);
  totalCount = computed(() => this.data().length);
  stats = computed(() => {
    if (this.mode() === 'notifications') {
      return [
        { label: 'No leídas', value: this.unreadCount(), helper: 'Pendientes por revisar' },
        { label: 'Leídas', value: this.readCount(), helper: 'Ya vistas por el usuario' },
        { label: 'Total', value: this.totalCount(), helper: 'Notificaciones cargadas' },
      ];
    }

    return [
      { label: 'Borradores', value: this.draftCount(), helper: 'Pendientes de revisión' },
      { label: 'Programadas', value: this.scheduledCount(), helper: 'Listas para envío' },
      { label: 'Enviadas', value: this.sentCount(), helper: 'Comunicaciones entregadas' },
      { label: 'Fallidas', value: this.failedCount(), helper: 'Requieren atención' },
    ];
  });

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path;
    this.mode.set(path === 'notifications' || path === 'email-logs' ? path : 'announcements');

    if (this.mode() === 'notifications') {
      this.loadNotifications();
      return;
    }

    if (this.mode() === 'announcements') {
      this.store.loadAll();
      return;
    }

    this.notificationData.set([]);
  }

  onHeaderAction(e: { action: { key: string } }) {
    if (e.action.key === 'create' && this.mode() === 'announcements') this.openForm();
    if (e.action.key === 'refresh') {
      if (this.mode() === 'notifications') {
        this.loadNotifications();
        return;
      }
      if (this.mode() === 'announcements') {
        this.store.loadAll();
      }
    }
  }

  viewDetail(communication: Communication) {
    if (this.mode() !== 'announcements') return;
    this.router.navigate(['/communications', communication.id], {
      state: { communication },
    });
  }

  editCommunication(communication: Communication) {
    if (this.mode() !== 'announcements') return;
    this.openForm(communication);
  }

  deleteCommunication(communication: Communication) {
    if (this.mode() !== 'announcements') return;
    this.store.delete(communication.id);
  }

  private openForm(current?: Communication | null) {
    this.dialog.open(CommunicationForm, {
      data: { current: current ?? null },
      width: '780px',
      maxHeight: '92vh',
    });
  }

  private loadNotifications() {
    this.notificationLoading.set(true);
    this.notificationApi.findAllCursor({ limit: 100 }).subscribe({
      next: (res) => {
        this.notificationData.set(
          (res.data ?? []).map((item) => ({
            id: item.id,
            subject: item.title,
            body: item.content,
            type: 'notification',
            status: item.isRead ? 'read' : 'unread',
            audience: 'all',
            sectionId: null,
            sectionName: null,
            sentAt: item.sendAt ?? item.createdAt,
            createdAt: item.createdAt,
            recipientCount: 1,
            createdBy: item.metadata?.sender?.name ?? 'Sistema',
          })),
        );
        this.notificationLoading.set(false);
      },
      error: () => {
        this.notificationLoading.set(false);
        this.notificationData.set([]);
      },
    });
  }
}
