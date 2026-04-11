import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sga-classroom-tasks-filters',

  imports: [FormsModule],
  templateUrl: './classroom-tasks-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTasksFilters {
  public search = model<string>('');
  public onClear = output<void>();
}
