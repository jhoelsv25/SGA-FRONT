import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sga-classroom-grades-filters',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './classroom-grades-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomGradesFilters {
  public search = model<string>('');
  public onClear = output<void>();
}
