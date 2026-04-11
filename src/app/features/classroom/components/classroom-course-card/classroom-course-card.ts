import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardIconComponent } from '@/shared/components/icon';
import type { VirtualClassroomItem } from '../../types/virtual-classroom-types';

@Component({
  selector: 'sga-classroom-course-card',

  imports: [CommonModule, RouterModule, ZardButtonComponent, ZardCardComponent, ZardIconComponent],
  templateUrl: './classroom-course-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomCourseCardComponent {
  classroom = input.required<VirtualClassroomItem>();

  teacherName(): string {
    const teacher = this.classroom().sectionCourse?.teacher?.person;
    const name = [teacher?.firstName, teacher?.lastName].filter(Boolean).join(' ');
    return name || this.classroom().sectionCourse?.teacher?.specialization || 'Sin docente';
  }
}
