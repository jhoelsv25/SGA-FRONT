import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sga-classroom-timeline-skeleton',
  standalone: true,
  templateUrl: './classroom-timeline-skeleton.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTimelineSkeleton {}
