import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YearAcademic, AcademicYearStatus, Modality } from '../../types/year-academi-types';

@Component({
  selector: 'sga-year-academic-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './year-academic-card.html',
  styleUrls: ['./year-academic-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearAcademicCardComponent {
  year = input.required<YearAcademic>();
  edit = output<YearAcademic>();
  delete = output<YearAcademic>();
  createPeriod = output<YearAcademic>();
  viewDetail = output<YearAcademic>();

  getStatusLabel(status: AcademicYearStatus): string {
    const labels: Record<string, string> = {
      [AcademicYearStatus.PLANNED]: 'Planificado',
      [AcademicYearStatus.ONGOING]: 'En curso',
      [AcademicYearStatus.COMPLETED]: 'Cerrado',
      [AcademicYearStatus.CANCELLED]: 'Cancelado',
    };
    return labels[status] ?? status;
  }

  getStatusColor(status: AcademicYearStatus): string {
    const colors: Record<string, string> = {
      [AcademicYearStatus.PLANNED]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      [AcademicYearStatus.ONGOING]: 'bg-green-500/10 text-green-500 border-green-500/20',
      [AcademicYearStatus.COMPLETED]: 'bg-muted text-muted-foreground border-border',
      [AcademicYearStatus.CANCELLED]: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status] ?? 'bg-muted text-muted-foreground border-border';
  }

  getModalityLabel(modality: Modality): string {
    const labels: Record<string, string> = {
      [Modality.IN_PERSON]: 'Presencial',
      [Modality.ONLINE]: 'Virtual',
      [Modality.HYBRID]: 'Híbrido',
    };
    return labels[modality] ?? modality;
  }
}
