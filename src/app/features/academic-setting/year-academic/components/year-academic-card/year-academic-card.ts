import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card/card';
import { Button } from '@shared/directives';
import { YearAcademic, AcademicYearStatus, Modality } from '../../types/year-academi-types';

@Component({
  selector: 'sga-year-academic-card',
  standalone: true,
  imports: [CommonModule, Card, CardHeader, CardTitle, CardContent, Button],
  templateUrl: './year-academic-card.html',
  styleUrls: ['./year-academic-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearAcademicCardComponent {
  @Input({ required: true }) year!: YearAcademic;
  
  @Output() edit = new EventEmitter<YearAcademic>();
  @Output() delete = new EventEmitter<YearAcademic>();

  getStatusLabel(status: AcademicYearStatus): string {
    const labels: Record<string, string> = {
      [AcademicYearStatus.PLANNED]: 'Planificado',
      [AcademicYearStatus.ACTIVE]: 'Activo',
      [AcademicYearStatus.CLOSED]: 'Cerrado'
    };
    return labels[status] || status;
  }

  getStatusColor(status: AcademicYearStatus): string {
    const colors: Record<string, string> = {
      [AcademicYearStatus.PLANNED]: 'bg-info/10 text-info border-info/20',
      [AcademicYearStatus.ACTIVE]: 'bg-success/10 text-success border-success/20',
      [AcademicYearStatus.CLOSED]: 'bg-base-content/10 text-base-content/60 border-base-content/20'
    };
    return colors[status] || 'bg-base-200 text-base-content/60';
  }

  getModalityLabel(modality: Modality): string {
    const labels: Record<string, string> = {
      [Modality.IN_PERSON]: 'Presencial',
      [Modality.VIRTUAL]: 'Virtual',
      [Modality.HYBRID]: 'Híbrido'
    };
    return labels[modality] || modality;
  }
}
