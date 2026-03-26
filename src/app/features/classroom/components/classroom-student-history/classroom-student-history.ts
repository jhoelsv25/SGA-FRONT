import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-classroom-student-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classroom-student-history.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomStudentHistory {
  public student = input.required<any>();
  public history = input.required<any[]>();
  public average = input<number>(0);
  public completion = input<number>(0);
  public totalAssessments = input<number>(0);
}
