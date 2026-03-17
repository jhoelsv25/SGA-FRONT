import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCardComponent } from '@/shared/components/card';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Course } from '../../types/course-types';


@Component({
  selector: 'sga-course-card',
  standalone: true,
  imports: [CommonModule, ZardCardComponent, ZardButtonComponent],
  templateUrl: './course-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  course = input.required<Course>();
  edit = output<Course>();
  delete = output<Course>();
}
