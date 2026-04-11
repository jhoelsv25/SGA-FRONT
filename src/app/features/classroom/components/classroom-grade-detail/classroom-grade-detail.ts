import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassroomGradeRecord } from '../../services/classroom-api';

@Component({
  selector: 'sga-classroom-grade-detail',

  imports: [CommonModule],
  templateUrl: './classroom-grade-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomGradeDetail {
  public record = input.required<ClassroomGradeRecord>();
  public studentOptions = input<any[]>([]);
  public selectedStudentId = input<string | null>(null);
  public canViewStudentDetail = input<boolean>(false);

  public onSelectStudent = output<string>();

  statusTone(value: number, total: number) {
    const ratio = total > 0 ? value / total : 0;
    if (ratio >= 0.85) return 'success';
    if (ratio >= 0.65) return 'info';
    return 'danger';
  }
}
