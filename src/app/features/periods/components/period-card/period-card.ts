import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Period, PeriodStatus } from '../../types/period-types';

@Component({
  selector: 'sga-period-card',

  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './period-card.html',
  styleUrls: ['./period-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodCardComponent {
  period = input.required<Period>();
  edit = output<Period>();
  delete = output<Period>();
  updateStatus = output<{ period: Period; status: PeriodStatus }>();

  readonly statusOptions = [
    { value: PeriodStatus.PLANNED, label: 'Planificado' },
    { value: PeriodStatus.IN_PROGRESS, label: 'En curso' },
    { value: PeriodStatus.COMPLETED, label: 'Completado' },
    { value: PeriodStatus.CANCELLED, label: 'Cancelado' },
  ] as const;

  getStatusLabel(status: PeriodStatus | string | undefined): string {
    const labels: Record<string, string> = {
      [PeriodStatus.PLANNED]: 'Planificado',
      [PeriodStatus.IN_PROGRESS]: 'En curso',
      [PeriodStatus.COMPLETED]: 'Completado',
      [PeriodStatus.CANCELLED]: 'Cancelado',
    };
    return labels[status ?? ''] ?? status ?? '-';
  }

  getStatusColor(status: PeriodStatus | string | undefined): string {
    const colors: Record<string, string> = {
      [PeriodStatus.PLANNED]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      [PeriodStatus.IN_PROGRESS]: 'bg-green-500/10 text-green-500 border-green-500/20',
      [PeriodStatus.COMPLETED]: 'bg-muted text-muted-foreground border-border',
      [PeriodStatus.CANCELLED]: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status ?? ''] ?? 'bg-muted text-muted-foreground border-border';
  }

  canChangeStatus(): boolean {
    return this.period().status !== PeriodStatus.COMPLETED;
  }

  onStatusSelect(status: PeriodStatus): void {
    if (!this.canChangeStatus()) return;
    this.updateStatus.emit({ period: this.period(), status });
  }
}
