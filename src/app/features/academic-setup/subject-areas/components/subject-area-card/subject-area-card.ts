import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@shared/ui/card/card';
import { Button } from '@shared/directives';
import type { SubjectArea, SubjectAreaType, StatusType } from '../../types/subject-area-types';

@Component({
  selector: 'sga-subject-area-card',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './subject-area-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectAreaCardComponent {
  subjectArea = input.required<SubjectArea>();
  edit = output<SubjectArea>();
  delete = output<SubjectArea>();

  getTypeLabel(type: SubjectAreaType | string): string {
    const labels: Record<string, string> = {
      core: 'Troncal',
      elective: 'Electiva',
      optional: 'Opcional',
    };
    return labels[type ?? ''] ?? type ?? '-';
  }

  getTypeColor(type: SubjectAreaType | string): string {
    const colors: Record<string, string> = {
      core: 'bg-primary/10 text-primary border-primary/20',
      elective: 'bg-info/10 text-info border-info/20',
      optional: 'bg-base-content/10 text-base-content/60 border-base-content/20',
    };
    return colors[type ?? ''] ?? 'bg-base-200 text-base-content/60';
  }

  getStatusLabel(status: StatusType | string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      suspended: 'Suspendido',
    };
    return labels[status ?? ''] ?? status ?? '-';
  }

  getStatusColor(status: StatusType | string): string {
    const colors: Record<string, string> = {
      active: 'bg-success/10 text-success border-success/20',
      inactive: 'bg-base-content/10 text-base-content/60 border-base-content/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      suspended: 'bg-error/10 text-error border-error/20',
    };
    return colors[status ?? ''] ?? 'bg-base-200 text-base-content/60';
  }
}
