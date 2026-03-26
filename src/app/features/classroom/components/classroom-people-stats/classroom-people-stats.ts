import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sga-classroom-people-stats',
  standalone: true,
  templateUrl: './classroom-people-stats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomPeopleStats {
  public teachersCount = input<number>(0);
  public studentsCount = input<number>(0);
  public teachersWithEmailCount = input<number>(0);
  public studentsWithCodeCount = input<number>(0);
}
