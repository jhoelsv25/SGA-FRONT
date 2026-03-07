import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@shared/ui/card/card';
import { Button } from '@shared/directives';
import type { SectionCourse } from '../../types/section-course-types';

const MODALITY_LABELS: Record<string, string> = {
  online: 'En línea',
  offline: 'Presencial',
  hybrid: 'Híbrido',
};

@Component({
  selector: 'sga-section-course-card',
  standalone: true,
  imports: [CommonModule, Card, Button],
  templateUrl: './section-course-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCourseCardComponent {
  sectionCourse = input.required<SectionCourse>();
  edit = output<SectionCourse>();
  delete = output<SectionCourse>();

  modalityLabel(modality?: string): string {
    return (modality && MODALITY_LABELS[modality]) || modality || '-';
  }
}
