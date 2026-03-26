import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ClassroomStore } from '../../services/store/classroom.store';

@Component({
  selector: 'sga-classroom-timeline-stats',
  standalone: true,
  templateUrl: './classroom-timeline-stats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassroomTimelineStats {
  private readonly store = inject(ClassroomStore);

  readonly totalPosts = computed(() => this.store.feed().length);
  readonly assignmentCount = computed(() => this.store.feed().filter((item) => item.type === 'assignment').length);
  readonly materialCount = computed(() => this.store.feed().filter((item) => item.type === 'material').length);
  readonly postCount = computed(() => this.store.feed().filter((item) => item.type === 'post').length);
}
