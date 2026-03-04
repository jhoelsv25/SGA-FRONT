import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card/card';
import { Button } from '@shared/directives';
import type { Course } from '../../types/course-types';

@Component({
  selector: 'sga-course-card',
  standalone: true,
  imports: [CommonModule, Card, CardHeader, CardTitle, CardContent, Button],
  templateUrl: './course-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  course = input.required<Course>();
  edit = output<Course>();
  delete = output<Course>();
}
