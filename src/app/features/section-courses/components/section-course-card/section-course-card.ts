import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import {
  ZardPopoverDirective,
  ZardPopoverComponent,
} from '@/shared/components/popover/popover.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SectionCourse } from '../../types/section-course-types';
import { MODALITY_LABELS } from '../../config/form.constants';

@Component({
  selector: 'sga-section-course-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './section-course-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCourseCardComponent {
  sectionCourse = input.required<SectionCourse>();
  edit = output<SectionCourse>();
  delete = output<SectionCourse>();
  assignTeacher = output<SectionCourse>();
  assignStudents = output<SectionCourse>();
  viewSchedules = output<SectionCourse>();
  createSchedule = output<SectionCourse>();

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

  hasTeacher(): boolean {
    return !!this.sectionCourse().teacher;
  }

  occupancyPercent(): number {
    const enrolled = Number(this.sectionCourse().enrolledStudents ?? 0);
    const max = Number(this.sectionCourse().maxStudents ?? 0);
    if (!max || max <= 0) return 0;
    return Math.min(Math.max((enrolled / max) * 100, 0), 100);
  }

  occupancyTone(): string {
    const percent = this.occupancyPercent();
    if (percent >= 100) return 'bg-danger';
    if (percent >= 80) return 'bg-warning';
    return 'bg-success';
  }

  occupancyLabel(): string {
    const percent = this.occupancyPercent();
    if (percent >= 100) return 'Capacidad completa';
    if (percent >= 80) return 'Capacidad alta';
    return 'Capacidad disponible';
  }
}
