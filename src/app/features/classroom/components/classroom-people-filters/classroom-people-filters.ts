import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sga-classroom-people-filters',

  imports: [FormsModule],
  templateUrl: './classroom-people-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomPeopleFilters {
  public search = model<string>('');
  public onClear = output<void>();
}
