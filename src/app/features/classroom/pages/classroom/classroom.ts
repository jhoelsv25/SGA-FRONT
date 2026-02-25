import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Button } from '@shared/directives';
import { ClassroomStore } from '../../services/store/classroom.store';
import { ClassroomSocketService } from '../../services/classroom-socket';
import { SectionCourseApi } from '@features/academic-setting/section-courses/services/section-course-api';
import type { ClassroomFeedItem } from '../../types/classroom-types';

@Component({
  selector: 'sga-classroom',
  standalone: true,
  imports: [CommonModule, RouterModule, Button],
  templateUrl: './classroom.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Classroom implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  public readonly store = inject(ClassroomStore);
  private readonly socket = inject(ClassroomSocketService);
  private readonly sectionCourseApi = inject(SectionCourseApi);

  sectionId = signal('');
  sectionName = signal('Aula Virtual');
  notifications = signal<{ type: string; title: string; body?: string }[]>([]);
  showNotificationPanel = signal(false);

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'] ?? '';
      this.sectionId.set(id);
      if (id) {
        this.store.loadFeed(id);
        this.store.loadChat(id);
        this.socket.connect(id);

        this.sectionCourseApi.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (sc) => {
            const name = sc.section?.name && sc.course?.name
              ? `${sc.course.name} - ${sc.section.name}`
              : sc.section?.name ?? sc.course?.name ?? 'Aula Virtual';
            this.sectionName.set(name);
          },
          error: () => { this.sectionName.set('Aula Virtual'); },
        });

        this.socket.message$
          .pipe(takeUntil(this.destroy$))
          .subscribe((msg) => this.store.receiveMessage(msg));

        this.socket.feedUpdate$
          .pipe(takeUntil(this.destroy$))
          .subscribe((item) =>
            this.store.receiveFeedUpdate(item as ClassroomFeedItem)
          );

        this.socket.notification$
          .pipe(takeUntil(this.destroy$))
          .subscribe((n) => {
            this.notifications.update((prev) => [n, ...prev].slice(0, 20));
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socket.disconnect();
  }

  clearNotifications(): void {
    this.notifications.set([]);
    this.showNotificationPanel.set(false);
  }
}
