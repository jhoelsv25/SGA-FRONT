import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardEmptyComponent } from '@/shared/components/empty';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { DialogModalService } from '@shared/widgets/dialog-modal';
import { Toast } from '@core/services/toast';
import { CommunicationApi } from '../../services/communication-api';
import type { Communication } from '../../types/communication-types';
import { CommunicationForm } from '../../components/communication-form/communication-form';

@Component({
  selector: 'sga-communication-detail',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent, ZardEmptyComponent, ZardSkeletonComponent],
  templateUrl: './communication-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CommunicationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly communicationApi = inject(CommunicationApi);
  private readonly dialog = inject(DialogModalService);
  private readonly toast = inject(Toast);

  readonly communication = signal<Communication | null>((history.state?.communication as Communication | undefined) ?? null);
  readonly loading = signal(true);

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      draft: 'Borrador',
      scheduled: 'Programada',
      sent: 'Enviada',
      failed: 'Fallida',
    };
    return map[this.communication()?.status ?? ''] ?? (this.communication()?.status || 'Sin estado');
  });

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      email: 'Email',
      sms: 'SMS',
      notification: 'Notificación',
      announcement: 'Anuncio',
      other: 'Otro',
    };
    return map[this.communication()?.type ?? ''] ?? (this.communication()?.type || 'Sin tipo');
  });

  readonly audienceLabel = computed(() => {
    const map: Record<string, string> = {
      students: 'Estudiantes',
      teachers: 'Docentes',
      guardians: 'Apoderados',
      all: 'Todos',
    };
    return map[this.communication()?.audience ?? ''] ?? 'Sin audiencia';
  });

  readonly deliveryLabel = computed(() =>
    this.communication()?.status === 'scheduled' ? 'Programado' : 'Inmediato',
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/communications/announcements']);
      return;
    }
    this.loadCommunication(id);
  }

  goBack(): void {
    this.router.navigate(['/communications/announcements']);
  }

  openEdit(): void {
    const current = this.communication();
    if (!current) return;
    this.dialog.open(CommunicationForm, {
      data: { current },
      width: '780px',
      maxHeight: '92vh',
    }).closed.subscribe(() => this.reload());
  }

  deleteCurrent(): void {
    const current = this.communication();
    if (!current) return;
    this.communicationApi.delete(current.id).subscribe({
      next: () => {
        this.toast.success('Comunicación eliminada');
        this.router.navigate(['/communications/announcements']);
      },
      error: (error) => {
        this.toast.error('No se pudo eliminar la comunicación', { description: error?.message });
      },
    });
  }

  private reload(): void {
    const id = this.communication()?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadCommunication(id);
  }

  private loadCommunication(id: string): void {
    this.loading.set(true);
    this.communicationApi.getById(id).subscribe({
      next: (res) => {
        this.communication.set(res.data);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar la comunicación', { description: error?.message });
        this.router.navigate(['/communications/announcements']);
      },
    });
  }
}
