import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardDatePickerComponent } from '@/shared/components/date-picker';
import { Toast } from '@core/services/toast';
import { GeolocationService } from '@core/services/geolocation.service';
import { InstitutionStore } from '@features/admin-services/store/institution.store';
import { AccessControlApi, AccessControlEvent, AccessControlEventType, AccessControlResolvedPerson } from '../../services/access-control-api';

@Component({
  selector: 'sga-general-attendance-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ZardInputDirective, ZardDatePickerComponent],
  templateUrl: './general-attendance.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class GeneralAttendancePage implements OnInit, OnDestroy {
  private readonly accessControlApi = inject(AccessControlApi);
  private readonly toast = inject(Toast);
  private readonly geoService = inject(GeolocationService);
  private readonly institutionStore = inject(InstitutionStore);

  readonly date = signal(this.toLocalDate(new Date()));
  readonly scanCode = signal('');
  readonly eventType = signal<AccessControlEventType>('entry');
  readonly notes = signal('');
  readonly saving = signal(false);
  readonly recentEvents = signal<AccessControlEvent[]>([]);
  readonly lastRegistered = signal<AccessControlEvent | null>(null);
  readonly resolvedPreview = signal<AccessControlResolvedPerson | null>(null);
  readonly resolving = signal(false);
  readonly codeChangedSinceResolve = signal(false);
  readonly resolveError = signal<string | null>(null);

  private resolveTimer: ReturnType<typeof setTimeout> | null = null;

  readonly todayCount = computed(() => this.recentEvents().length);
  readonly entryCount = computed(() => this.recentEvents().filter((row) => row.eventType === 'entry').length);
  readonly exitCount = computed(() => this.recentEvents().filter((row) => row.eventType === 'exit').length);
  readonly geoError = computed(() => this.geoService.error());
  readonly geoErrorKind = computed(() => this.geoService.errorKind());
  readonly hasPosition = computed(() => Boolean(this.geoService.currentPosition()));
  readonly needsLocationValidation = computed(() => {
    const institution = this.institutionStore.institution();
    return Boolean(institution?.latitude !== undefined && institution?.longitude !== undefined && institution?.geofenceRadius);
  });
  readonly locationReady = computed(() => !this.needsLocationValidation() || this.hasPosition());
  readonly geofenceStatus = computed(() => {
    const institution = this.institutionStore.institution();
    const pos = this.geoService.currentPosition();
    if (!institution?.latitude || !institution?.longitude || !institution?.geofenceRadius || !pos) return null;

    const distance = this.geoService.calculateDistance(
      pos.coords.latitude,
      pos.coords.longitude,
      Number(institution.latitude),
      Number(institution.longitude),
    );

    return {
      within: distance <= Number(institution.geofenceRadius),
      distance: Math.round(distance),
      radius: Number(institution.geofenceRadius),
    };
  });

  ngOnInit(): void {
    this.loadRecent();
    this.institutionStore.loadMain();
    this.geoService.startWatching();
  }

  ngOnDestroy(): void {
    this.geoService.stopWatching();
    if (this.resolveTimer) clearTimeout(this.resolveTimer);
  }

  loadRecent() {
    this.accessControlApi.getAll({ date: this.date(), limit: 20 }).subscribe({
      next: (res) => this.recentEvents.set(res.data ?? []),
      error: () => this.toast.error('No se pudo cargar el historial de accesos'),
    });
  }

  retryLocation() {
    this.geoService.requestCurrentPosition();
  }

  onCodeChange(value: string) {
    this.scanCode.set(value);
    this.codeChangedSinceResolve.set(true);
    this.resolveError.set(null);
    this.scheduleResolve(value);
  }

  resolveCode() {
    const code = this.scanCode().trim();
    if (!code) {
      this.resolvedPreview.set(null);
      this.resolveError.set(null);
      return;
    }

    this.resolving.set(true);
    this.resolveError.set(null);
    this.accessControlApi.resolve(code).subscribe({
      next: (res) => {
        this.resolving.set(false);
        this.resolvedPreview.set(res.data);
        if (this.codeChangedSinceResolve()) {
          this.eventType.set(res.data.suggestedEventType);
        }
        this.codeChangedSinceResolve.set(false);
      },
      error: (err) => {
        this.resolving.set(false);
        this.resolvedPreview.set(null);
        this.resolveError.set(err?.error?.message || 'No se encontró ninguna persona con ese DNI o código.');
      },
    });
  }

  submitCode(rawValue?: string) {
    const code = String(rawValue ?? this.scanCode()).trim();
    if (!code || this.saving()) return;

    if (this.needsLocationValidation() && !this.hasPosition()) {
      this.toast.error(this.geoError() || 'Debes habilitar la ubicación para registrar accesos.');
      return;
    }

    if (this.geofenceStatus() && !this.geofenceStatus()!.within) {
      this.toast.error('Tu ubicación actual está fuera de la geocerca institucional.');
      return;
    }

    const inst = this.institutionStore.institution();
    const pos = this.geoService.currentPosition();
    let isWithinGeofence = true;

    if (inst && pos && inst.latitude !== undefined && inst.longitude !== undefined && inst.geofenceRadius !== undefined) {
      const distance = this.geoService.calculateDistance(
        pos.coords.latitude,
        pos.coords.longitude,
        Number(inst.latitude),
        Number(inst.longitude),
      );
      isWithinGeofence = distance <= Number(inst.geofenceRadius);
    }

    this.saving.set(true);
    this.accessControlApi.register({
      code,
      eventType: this.eventType(),
      notes: this.notes().trim() || undefined,
      latitude: pos?.coords.latitude,
      longitude: pos?.coords.longitude,
      isWithinGeofence,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.scanCode.set('');
        this.notes.set('');
        this.lastRegistered.set(res.data);
        this.recentEvents.update((current) => [res.data, ...current].slice(0, 20));
        this.toast.success(res.message || 'Movimiento registrado');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message || 'No se pudo registrar el movimiento');
      },
    });
  }

  eventTypeLabel(value: AccessControlEventType) {
    return value === 'entry' ? 'Ingreso' : 'Salida';
  }

  personTypeLabel(value?: string) {
    return value === 'teacher' ? 'Docente' : value === 'student' ? 'Estudiante' : 'Persona';
  }

  locationHelpText() {
    if (this.geoErrorKind() === 'permission') {
      return 'El navegador no tiene permiso para usar tu ubicación. Revisa el permiso del sitio y del sistema operativo.';
    }

    if (this.geoErrorKind() === 'unavailable') {
      return 'En Mac esto suele corresponder a CoreLocation sin posición fija todavía. Activa Wi-Fi, mantén Servicios de localización encendidos y vuelve a intentar.';
    }

    if (this.geoErrorKind() === 'timeout') {
      return 'La ubicación tardó demasiado en responder. Espera unos segundos y vuelve a intentar.';
    }

    return 'Debes habilitar la ubicación del navegador para registrar accesos.';
  }

  private scheduleResolve(value: string) {
    if (this.resolveTimer) clearTimeout(this.resolveTimer);

    const code = value.trim();
    if (code.length < 4) {
      this.resolvedPreview.set(null);
      this.resolveError.set(null);
      return;
    }

    this.resolveTimer = setTimeout(() => this.resolveCode(), 280);
  }

  private toLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
