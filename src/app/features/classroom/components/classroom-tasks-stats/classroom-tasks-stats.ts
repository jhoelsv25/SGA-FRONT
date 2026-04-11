import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sga-classroom-tasks-stats',

  templateUrl: './classroom-tasks-stats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTasksStats {
  public pendingCount = input<number>(0);
  public deliveredCount = input<number>(0);
  public gradedCount = input<number>(0);
  public lateCount = input<number>(0);
}
