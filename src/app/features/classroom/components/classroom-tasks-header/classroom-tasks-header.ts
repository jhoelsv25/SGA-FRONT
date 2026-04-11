import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'sga-classroom-tasks-header',

  templateUrl: './classroom-tasks-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTasksHeader {
  public pageLabel = input.required<string>();
  public totalVisibleTasks = input<number>(0);
  public canCreateTask = input<boolean>(false);
  public onCreate = output<void>();
}
