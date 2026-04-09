import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationSocketService } from '@core/services/notification-socket.service';
import { TeacherAttendanceApi } from '@features/teachers/services/api/teacher-attendance-api';
import { InstitutionApi } from '@features/admin-services/api/institution-api';
import { Institution } from '@features/institution/types/institution-types';
import { ZardIconComponent } from '@shared/components/icon';
import { ZardInputDirective } from '@/shared/components/input';

declare const L: any;

@Component({
  selector: 'sga-realtime-teaching-overview',
  standalone: true,
  imports: [CommonModule, ZardIconComponent, ZardInputDirective],
  templateUrl: './realtime-teaching-overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealtimeTeachingOverviewComponent implements OnInit, OnDestroy {
  private readonly api = inject(TeacherAttendanceApi);
  private readonly router = inject(Router);
  private readonly notificationSocket = inject(NotificationSocketService);
  private readonly institutionApi = inject(InstitutionApi);
  private overviewSubscription?: { unsubscribe(): void };

  readonly viewMode = signal<'list' | 'map'>('list');
  readonly search = signal('');
  readonly institution = signal<Institution | null>(null);
  
  private map: any;
  private markers: any[] = [];
  private geofenceCircle: any;

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
        latitude?: number;
        longitude?: number;
        isWithinGeofence?: boolean;
      }>;
  } | null>(null);

  readonly activeCount = computed(() => this.data()?.counts.ongoing ?? 0);
  readonly hasMapCoordinates = computed(() => {
    const inst = this.institution();
    return this.toCoordinate(inst?.latitude) !== null && this.toCoordinate(inst?.longitude) !== null;
  });
  readonly filteredTeachers = computed(() => {
    const term = this.search().trim().toLowerCase();
    const items = this.data()?.activeTeachers ?? [];
    if (!term) return items;

    return items.filter((item) =>
      [
        item.teacherName,
        item.teacherCode,
        item.courseName,
        item.sectionName,
        item.classroom,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term)),
    );
  });

  ngOnInit(): void {
    this.load();
    this.notificationSocket.connect();
    this.overviewSubscription = this.notificationSocket.teacherRealtimeOverview$.subscribe((payload) => {
      this.data.set(payload);
      this.loading.set(false);
      this.updateMapMarkers();
    });
    this.loadInstitution();
  }

  private loadInstitution(): void {
    this.institutionApi.getMain().subscribe({
      next: (inst) => {
        this.institution.set(inst);
        this.initMap();
      }
    });
  }

  private initMap(): void {
    const inst = this.institution();
    const latitude = this.toCoordinate(inst?.latitude);
    const longitude = this.toCoordinate(inst?.longitude);
    if (!inst || latitude === null || longitude === null) return;

    setTimeout(() => {
      if (this.map) return;
      
      const mapEl = document.getElementById('monitoring-map');
      if (!mapEl) return;

      this.map = L.map('monitoring-map').setView([latitude, longitude], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.geofenceCircle = L.circle([latitude, longitude], {
        color: '#b02234',
        fillColor: '#b02234',
        fillOpacity: 0.1,
        radius: this.toRadius(inst.geofenceRadius)
      }).addTo(this.map);

      this.updateMapMarkers();
    }, 100);
  }

  private updateMapMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const teachers = this.filteredTeachers();
    teachers.forEach(t => {
      if (t.latitude && t.longitude) {
        const color = t.isWithinGeofence ? '#10b981' : '#ef4444';
        const marker = L.circleMarker([t.latitude, t.longitude], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(this.map);

        marker.bindPopup(`
          <div class="p-1">
            <p class="font-bold text-sm mb-1">${t.teacherName}</p>
            <p class="text-[10px] text-base-content/60 uppercase font-black">${t.courseName}</p>
            <p class="text-[10px] text-base-content/60">${t.classroom}</p>
            <p class="mt-2 text-[10px] font-bold ${t.isWithinGeofence ? 'text-emerald-600' : 'text-rose-600'}">
              ${t.isWithinGeofence ? 'DENTRO DEL PLANTEL' : 'FUERA DE RANGO'}
            </p>
          </div>
        `);
        this.markers.push(marker);
      }
    });
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.updateMapMarkers();
  }

  private toCoordinate(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toRadius(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
  }

  setViewMode(mode: 'list' | 'map'): void {
    this.viewMode.set(mode);
    if (mode === 'map') {
      setTimeout(() => {
        if (!this.map) this.initMap();
        else this.map.invalidateSize();
      }, 50);
    }
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
        this.updateMapMarkers();
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
