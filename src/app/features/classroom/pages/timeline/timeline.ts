import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomTimelineStats } from '../../components/classroom-timeline-stats/classroom-timeline-stats';
import { ClassroomTimelinePublisher } from '../../components/classroom-timeline-publisher/classroom-timeline-publisher';
import { ClassroomTimelineFeedItem } from '../../components/classroom-timeline-feed-item/classroom-timeline-feed-item';
import { ClassroomTimelineSkeleton } from '../../components/classroom-timeline-skeleton/classroom-timeline-skeleton';

@Component({
  selector: 'sga-classroom-timeline',
  standalone: true,
  imports: [
    CommonModule, 
    ClassroomTimelineStats, 
    ClassroomTimelinePublisher, 
    ClassroomTimelineFeedItem,
    ClassroomTimelineSkeleton
  ],
  templateUrl: './timeline.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Timeline {
  public readonly store = inject(ClassroomStore);
}
