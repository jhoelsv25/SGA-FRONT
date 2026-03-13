import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@shared/adapters/ui/card/card';
import { Button } from '@shared/directives';
import { YearAcademic, AcademicYearStatus, Modality } from '../../types/year-academi-types';

@Component({
  selector: 'sga-year-academic-card',
  standalone: true,
  imports: [CommonModule, Card, Button],
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
      [AcademicYearStatus.PLANNED]: 'bg-info/10 text-info border-info/20',
      [AcademicYearStatus.ONGOING]: 'bg-success/10 text-success border-success/20',
      [AcademicYearStatus.COMPLETED]: 'bg-base-content/10 text-base-content/60 border-base-content/20',
      [AcademicYearStatus.CANCELLED]: 'bg-error/10 text-error border-error/20',
    };
    return colors[status] ?? 'bg-base-200 text-base-content/60';
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
