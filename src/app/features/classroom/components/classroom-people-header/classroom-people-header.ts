import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'sga-classroom-people-header',
  standalone: true,
  templateUrl: './classroom-people-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomPeopleHeader {
  public profileType = input<string>('user');
  public teachersCount = input<number>(0);
  public studentsCount = input<number>(0);
}
