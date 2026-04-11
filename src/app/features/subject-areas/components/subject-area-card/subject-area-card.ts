import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SubjectArea, SubjectAreaType, StatusType } from '../../types/subject-area-types';

@Component({
  selector: 'sga-subject-area-card',

  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './subject-area-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectAreaCardComponent {
  subjectArea = input.required<SubjectArea>();
  edit = output<SubjectArea>();
  delete = output<SubjectArea>();
  viewCourses = output<SubjectArea>();

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
      elective: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      optional: 'bg-muted text-muted-foreground border-border',
    };
    return colors[type ?? ''] ?? 'bg-muted text-muted-foreground border-border';
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
      active: 'bg-green-500/10 text-green-500 border-green-500/20',
      inactive: 'bg-muted text-muted-foreground border-border',
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      suspended: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status ?? ''] ?? 'bg-muted text-muted-foreground border-border';
  }
}
