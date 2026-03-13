import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@shared/adapters/ui/card/card';
import { Button } from '@shared/directives';
import { Period, PeriodStatus } from '../../types/period-types';

@Component({
  selector: 'sga-period-card',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './period-card.html',
  styleUrls: ['./period-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodCardComponent {
  period = input.required<Period>();
  edit = output<Period>();
  delete = output<Period>();
  updateStatus = output<Period>();

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
      [PeriodStatus.PLANNED]: 'bg-info/10 text-info border-info/20',
      [PeriodStatus.IN_PROGRESS]: 'bg-success/10 text-success border-success/20',
      [PeriodStatus.COMPLETED]: 'bg-base-content/10 text-base-content/60 border-base-content/20',
      [PeriodStatus.CANCELLED]: 'bg-error/10 text-error border-error/20',
    };
    return colors[status ?? ''] ?? 'bg-base-200 text-base-content/60';
  }
}
