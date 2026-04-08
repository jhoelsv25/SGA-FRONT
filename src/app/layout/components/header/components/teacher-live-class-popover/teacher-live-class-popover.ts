import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationSocketService } from '@core/services/notification-socket.service';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import { TeacherLiveSessionItem } from '@features/teachers/types/teacher-attendance-types';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';

@Component({
  selector: 'sga-teacher-live-class-popover',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardPopoverDirective,
    ZardPopoverComponent,
  ],
  templateUrl: './teacher-live-class-popover.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherLiveClassPopoverComponent implements OnInit, OnDestroy {
  private readonly api = inject(TeacherAttendanceApi);
  private readonly router = inject(Router);
  private readonly notificationSocket = inject(NotificationSocketService);
  private liveSessionSubscription?: { unsubscribe(): void };

  readonly currentSession = signal<TeacherLiveSessionItem | null>(null);
  readonly upcomingSession = signal<TeacherLiveSessionItem | null>(null);
  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly session = computed(() => this.currentSession() ?? this.upcomingSession());
  readonly isLive = computed(() => this.session()?.state === 'ongoing');
  readonly indicatorClasses = computed(() => {
    const state = this.session()?.state;
    if (state === 'ongoing') return 'bg-primary';
    if (state === 'ready') return 'bg-emerald-500';
    if (state === 'upcoming') return 'bg-amber-500';
    if (state === 'missed') return 'bg-danger';
    return 'bg-base-content/30';
  });
  readonly badge = computed(() => {
    const session = this.session();
    if (!session) return 'Sin clase';
    if (session.state === 'ongoing') return 'En curso';
    if (session.state === 'ready') return 'Iniciar';
    if (session.state === 'upcoming') return 'Próxima';
    if (session.state === 'missed') return 'Pendiente';
    return 'Finalizada';
  });

  ngOnInit(): void {
    this.load();
    this.notificationSocket.connect();
    this.liveSessionSubscription = this.notificationSocket.teacherLiveSession$.subscribe((payload) => {
      this.currentSession.set(payload.current);
      this.upcomingSession.set(payload.upcoming);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.liveSessionSubscription?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.api.getTeacherLiveSession().subscribe({
      next: (response) => {
        this.currentSession.set(response.data.current);
        this.upcomingSession.set(response.data.upcoming);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  label(): string {
    const session = this.session();
    if (!session) return 'Sin clase próxima';
    if (session.state === 'ongoing') return session.endsInMinutes > 0 ? `Quedan ${session.endsInMinutes} min` : 'Cierre pendiente';
    if (session.state === 'ready') return 'Disponible para iniciar';
    if (session.state === 'upcoming') return session.startsInMinutes <= 0 ? 'Empieza ahora' : `Empieza en ${session.startsInMinutes} min`;
    if (session.state === 'missed') return 'Clase no iniciada';
    return 'Clase finalizada';
  }

  progressLabel(): string {
    const session = this.session();
    if (!session) return '0.0%';
    return `${session.progressPercentage.toFixed(1)}%`;
  }

  startClass(): void {
    const session = this.session();
    if (!session) return;
    this.actionLoading.set(true);
    this.api.startTeacherLiveSession(session.scheduleId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.load();
      },
      error: () => this.actionLoading.set(false),
    });
  }

  finishClass(): void {
    const session = this.session();
    if (!session) return;
    this.actionLoading.set(true);
    this.api.finishTeacherLiveSession(session.scheduleId).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.load();
      },
      error: () => this.actionLoading.set(false),
    });
  }

  openSchedules(): void {
    this.router.navigate(['/organization/schedules']);
  }
}
