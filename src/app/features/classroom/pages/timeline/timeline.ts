import { ChangeDetectionStrategy, Component, HostListener, inject, OnDestroy, signal } from '@angular/core';
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
  public readonly search = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  onSearchChange(value: string): void {
    this.search.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      const sectionId = this.store.selectedSectionId();
      if (!sectionId) return;
      this.store.loadFeed({ id: sectionId, search: this.search() });
    }, 280);
  }

  clearSearch(): void {
    this.onSearchChange('');
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.store.loading() || this.store.feedLoadingMore() || !this.store.feedHasNext()) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const documentHeight = document.documentElement.scrollHeight || 0;

    if (scrollTop + viewportHeight >= documentHeight - 240) {
      this.store.loadOlderFeed()?.subscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }
}
