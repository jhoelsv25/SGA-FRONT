import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sga-classroom-grades-header',

  imports: [CommonModule],
  templateUrl: './classroom-grades-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomGradesHeader {
  public pageTitle = input.required<string>();
  public pageDescription = input.required<string>();
  public assessmentsCount = input<number>(0);
  public scoresCount = input<number>(0);
  public average = input<number>(0);
  public averageLabel = input<string>();
}
