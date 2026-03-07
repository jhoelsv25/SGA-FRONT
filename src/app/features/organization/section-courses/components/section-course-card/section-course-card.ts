import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '@shared/ui/card/card';
import { Button } from '@shared/directives';
import type { SectionCourse } from '../../types/section-course-types';
import { MODALITY_LABELS } from '../../config/form.constants';

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

  getTeacherLabel(teacher?: SectionCourse['teacher']): string {
    if (!teacher) return '-';
    if (typeof teacher === 'string') return teacher;
    const person = teacher.person as { firstName?: string; lastName?: string } | undefined;
    if (person?.firstName || person?.lastName) {
      return `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
    }
    return teacher.teacherCode ?? teacher.specialization ?? teacher.id ?? '-';
  }
}
