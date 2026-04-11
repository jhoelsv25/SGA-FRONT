import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassroomGradeRecord } from '../../services/classroom-api';

@Component({
  selector: 'sga-classroom-grades-sidebar',

  imports: [CommonModule],
  templateUrl: './classroom-grades-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomGradesSidebar {
  public records = input.required<ClassroomGradeRecord[]>();
  public selectedRecordId = input<string | null>(null);
  public onSelect = output<string>();
}
