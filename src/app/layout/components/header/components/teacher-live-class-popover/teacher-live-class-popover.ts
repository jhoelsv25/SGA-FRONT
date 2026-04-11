import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { NotificationSocketService } from '@core/services/notification-socket.service';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import {
  TeacherLiveSessionItem,
  TeacherDailyAttendance,
} from '@features/teachers/types/teacher-attendance-types';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@shared/components/icon';
import { ZardPopoverComponent, ZardPopoverDirective } from '@/shared/components/popover';
import { GeolocationService } from '@core/services/geolocation.service';
import { InstitutionApi } from '@features/admin-services/api/institution-api';
import { Institution } from '@features/institution/types/institution-types';

@Component({
  selector: 'sga-teacher-live-class-popover',

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

  private readonly institutionApi = inject(InstitutionApi);
  private readonly geoService = inject(GeolocationService);

  readonly currentSession = signal<TeacherLiveSessionItem | null>(null);
  readonly upcomingSession = signal<TeacherLiveSessionItem | null>(null);
  readonly dailyAttendance = signal<TeacherDailyAttendance | null>(null);
  readonly institution = signal<Institution | null>(null);
  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly accessMessage = signal<string | null>(null);
  readonly session = computed(() => this.currentSession() ?? this.upcomingSession());
  readonly isLive = computed(() => this.session()?.state === 'ongoing');
  readonly canStartClass = computed(() => {
    const session = this.session();
    return Boolean(session && !session.actualStartTime && session.actionEnabled);
  });
  private readonly outOfRangeStartTime = signal<number | null>(null);
  readonly accumulatedDowntime = signal<number>(0);

  constructor() {
    effect(() => {
      const isLive = this.isLive();
      const isOut = this.isOutOfRange();
      const startTime = this.outOfRangeStartTime();

      if (isLive && isOut && startTime === null) {
        // Salió del rango durante la clase
        this.outOfRangeStartTime.set(Date.now());
      } else if ((!isLive || !isOut) && startTime !== null) {
        // Recuperó rango o terminó la clase
        const durationMs = Date.now() - startTime;
        if (durationMs > 10000) {
          // Solo si duró más de 10 segundos para evitar rebotes
          const minutes = Math.round(durationMs / 60000);
          this.accumulatedDowntime.update((total) => total + (minutes || 1));
        }
        this.outOfRangeStartTime.set(null);
      }
    });
  }

  readonly distanceToSchool = computed(() => {
    const pos = this.geoService.currentPosition();
    const inst = this.institution();
    if (!pos || !inst || inst.latitude === undefined || inst.longitude === undefined) return null;
    return this.geoService.calculateDistance(
      pos.coords.latitude,
      pos.coords.longitude,
      Number(inst.latitude),
      Number(inst.longitude),
    );
  });

  readonly isOutOfRange = computed(() => {
    const dist = this.distanceToSchool();
    const inst = this.institution();
    if (dist === null || !inst || inst.geofenceRadius === undefined) return false;
    return dist > inst.geofenceRadius;
  });

  readonly indicatorClasses = computed(() => {
    const state = this.session()?.state;
    if (state === 'ongoing') {
      return this.isOutOfRange() ? 'bg-danger animate-pulse' : 'bg-primary';
    }
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
    this.liveSessionSubscription = this.notificationSocket.teacherLiveSession$.subscribe(
      (payload) => {
        this.currentSession.set(payload.current);
        this.upcomingSession.set(payload.upcoming);
        this.loading.set(false);
        this.checkGeoTracking();
      },
    );
    this.loadDailyStatus();
    this.loadInstitution();
  }

  private loadInstitution(): void {
    this.institutionApi.getMain().subscribe({
      next: (data) => this.institution.set(data),
    });
  }

  private checkGeoTracking(): void {
    if (this.isLive()) {
      this.geoService.startWatching();
    } else {
      this.geoService.stopWatching();
    }
  }

  ngOnDestroy(): void {
    this.liveSessionSubscription?.unsubscribe();
    this.geoService.stopWatching();
  }

  load(): void {
    this.loading.set(true);
    this.accessMessage.set(null);
    this.api.getTeacherLiveSession().subscribe({
      next: (response) => {
        this.currentSession.set(response.data.current);
        this.upcomingSession.set(response.data.upcoming);
        this.loading.set(false);
        this.checkGeoTracking();
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.currentSession.set(null);
        this.upcomingSession.set(null);
        if (error.status === 403) {
          this.accessMessage.set('Este acceso rápido solo está disponible para cuentas docentes.');
          return;
        }
        if (error.status === 404) {
          this.accessMessage.set('No se encontró un perfil docente asociado a esta cuenta.');
          return;
        }
        this.accessMessage.set('No se pudo cargar la clase en vivo en este momento.');
      },
    });
    this.loadDailyStatus();
  }

  loadDailyStatus(): void {
    this.api.getDailyAttendanceStatus().subscribe({
      next: (response) => this.dailyAttendance.set(response.data),
      error: (error: HttpErrorResponse) => {
        this.dailyAttendance.set(null);
        if (!this.accessMessage() && (error.status === 403 || error.status === 404)) {
          this.accessMessage.set('Este acceso rápido solo está disponible para cuentas docentes.');
        }
      },
    });
  }

  label(): string {
    const session = this.session();
    if (!session) return 'Sin clase próxima';
    if (session.state === 'ongoing')
      return session.endsInMinutes > 0 ? `Quedan ${session.endsInMinutes} min` : 'Cierre pendiente';
    if (session.state === 'ready') return 'Disponible para iniciar';
    if (session.state === 'upcoming') {
      if (session.actionEnabled) {
        return session.startsInMinutes <= 0
          ? 'Puedes iniciar ahora'
          : `Puedes iniciar, faltan ${session.startsInMinutes} min`;
      }
      return session.startsInMinutes <= 0
        ? 'Empieza ahora'
        : `Empieza en ${session.startsInMinutes} min`;
    }
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

    const spatialContext = {
      latitude: this.geoService.currentPosition()?.coords.latitude,
      longitude: this.geoService.currentPosition()?.coords.longitude,
      isWithinGeofence: !this.isOutOfRange(),
    };

    this.api.startTeacherLiveSession(session.scheduleId, spatialContext).subscribe({
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

    const spatialContext = {
      latitude: this.geoService.currentPosition()?.coords.latitude,
      longitude: this.geoService.currentPosition()?.coords.longitude,
      isWithinGeofence: !this.isOutOfRange(),
    };

    const downtime = this.accumulatedDowntime();
    const body: any = {};
    if (downtime > 0) {
      body.downTimeMinutes = downtime;
      body.downTimeReason = 'Tiempo detectado fuera de la geovalla institucional por GPS.';
    }

    this.api.finishTeacherLiveSession(session.scheduleId, body, spatialContext).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.accumulatedDowntime.set(0);
        this.load();
      },
      error: () => this.actionLoading.set(false),
    });
  }

  clockInDaily(): void {
    this.actionLoading.set(true);
    const spatialContext = {
      latitude: this.geoService.currentPosition()?.coords.latitude,
      longitude: this.geoService.currentPosition()?.coords.longitude,
      isWithinGeofence: !this.isOutOfRange(),
    };
    this.api.markDailyClockIn(spatialContext).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadDailyStatus();
      },
      error: () => this.actionLoading.set(false),
    });
  }

  clockOutDaily(): void {
    this.actionLoading.set(true);
    const spatialContext = {
      latitude: this.geoService.currentPosition()?.coords.latitude,
      longitude: this.geoService.currentPosition()?.coords.longitude,
      isWithinGeofence: !this.isOutOfRange(),
    };
    this.api.markDailyClockOut(spatialContext).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadDailyStatus();
      },
      error: () => this.actionLoading.set(false),
    });
  }

  openSchedules(): void {
    this.router.navigate(['/organization/schedules']);
  }
}
