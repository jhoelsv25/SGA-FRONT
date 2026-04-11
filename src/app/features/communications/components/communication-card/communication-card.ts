import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import type { Communication } from '../../types/communication-types';

@Component({
  selector: 'sga-communication-card',

  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardCardComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './communication-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunicationCardComponent {
  communication = input.required<Communication>();
  readonlyMode = input(false);

  viewDetail = output<Communication>();
  edit = output<Communication>();
  delete = output<Communication>();

  readonly statusLabel = computed(() => {
    const map: Record<string, string> = {
      draft: 'Borrador',
      scheduled: 'Programada',
      sent: 'Enviada',
      failed: 'Fallida',
      unread: 'No leída',
      read: 'Leída',
    };
    return map[this.communication().status] ?? this.communication().status;
  });

  readonly typeLabel = computed(() => {
    const map: Record<string, string> = {
      email: 'Email',
      sms: 'SMS',
      notification: 'Notificación',
      announcement: 'Anuncio',
      other: 'Otro',
    };
    return map[this.communication().type] ?? this.communication().type;
  });

  readonly audienceLabel = computed(() => {
    const map: Record<string, string> = {
      students: 'Estudiantes',
      teachers: 'Docentes',
      guardians: 'Apoderados',
      all: 'Todos',
    };
    return map[this.communication().audience ?? ''] ?? 'Sin audiencia';
  });

  readonly statusClass = computed(() => {
    const map: Record<string, string> = {
      draft: 'border-base-300 bg-base-200 text-base-content/70',
      scheduled: 'border-warning/30 bg-warning/10 text-warning-700 dark:text-warning',
      sent: 'border-success/30 bg-success/10 text-success-700 dark:text-success',
      failed: 'border-danger/30 bg-danger/10 text-danger-700 dark:text-danger',
      unread: 'border-primary/25 bg-primary/10 text-primary',
      read: 'border-base-300 bg-base-200 text-base-content/70',
    };
    return map[this.communication().status] ?? 'border-base-300 bg-base-200 text-base-content/70';
  });

  readonly deliveryLabel = computed(() => {
    return this.communication().status === 'scheduled' ? 'Programado' : 'Inmediato';
  });
}
