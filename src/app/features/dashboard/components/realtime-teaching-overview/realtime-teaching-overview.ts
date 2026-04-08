import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationSocketService } from '@core/services/notification-socket.service';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';

@Component({
  selector: 'sga-realtime-teaching-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realtime-teaching-overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealtimeTeachingOverviewComponent implements OnInit, OnDestroy {
  private readonly api = inject(TeacherAttendanceApi);
  private readonly router = inject(Router);
  private readonly notificationSocket = inject(NotificationSocketService);
  private overviewSubscription?: { unsubscribe(): void };

  readonly loading = signal(false);
  readonly data = signal<{
    counts: { ongoing: number; ready: number; upcoming: number; missed: number; finished: number };
      activeTeachers: Array<{
        scheduleId: string;
        teacherId: string;
        teacherName: string;
        teacherCode: string;
        courseName: string;
      sectionName: string;
      classroom: string;
      progressPercentage: number;
      endsInMinutes: number;
    }>;
  } | null>(null);

  readonly activeCount = computed(() => this.data()?.counts.ongoing ?? 0);

  ngOnInit(): void {
    this.load();
    this.notificationSocket.connect();
    this.overviewSubscription = this.notificationSocket.teacherRealtimeOverview$.subscribe((payload) => {
      this.data.set(payload);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.overviewSubscription?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.api.getRealtimeOverview().subscribe({
      next: (response) => {
        this.data.set(response.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openTeacherMonitoring(item: {
    teacherId: string;
    teacherName: string;
  }): void {
    this.router.navigate(['/teachers/attendances'], {
      queryParams: {
        ...(item.teacherId ? { teacherId: item.teacherId } : {}),
        ...(item.teacherName ? { teacherName: item.teacherName } : {}),
      },
    });
  }
}
