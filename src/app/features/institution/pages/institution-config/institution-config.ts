import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardFormImports } from '@/shared/components/form';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { HeaderDetail as HeaderDetailComponent } from '@shared/widgets/header-detail/header-detail';
import { InstitutionApi } from '@features/admin-services/api/institution-api';
import { Institution } from '../../types/institution-types';
import { AuthStore } from '@auth/services/store/auth.store';
import { GeolocationService } from '@core/services/geolocation.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { merge, take, filter, Subscription } from 'rxjs';
import { Toast } from '@core/services/toast';

declare const L: any;

@Component({
  selector: 'sga-institution-config',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ZardButtonComponent, 
    ZardInputDirective, 
    ZardIconComponent, 
    HeaderDetailComponent,
    ...ZardFormImports
  ],
  templateUrl: './institution-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InstitutionConfig implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private api = inject(InstitutionApi);
  private authStore = inject(AuthStore);
  private geoService = inject(GeolocationService);
  private toast = inject(Toast);
  private currentPosition$ = toObservable(this.geoService.currentPosition);
  private previewSubscription?: Subscription;
  private formStateSubscription?: Subscription;
  private previewMap: any;
  private previewMarker: any;
  private previewCircle: any;
  private previewTiles: any;

  public configForm: FormGroup;
  public loading = signal(false);
  public saving = signal(false);
  public institution = signal<Institution | null>(null);
  public formInvalid = signal(true);
  public preview = signal<{ latitude: number | null; longitude: number | null; geofenceRadius: number }>({
    latitude: null,
    longitude: null,
    geofenceRadius: 50,
  });
  
  public isSuperAdmin = computed(() => this.authStore.currentUser()?.profile?.type === 'superadmin');
  public isCapturingLocation = computed(() => this.geoService.isWatching());
  public geolocationError = computed(() => this.geoService.error());
  public hasPreviewCoordinates = computed(() => {
    const { latitude, longitude } = this.preview();
    return Number.isFinite(latitude) && Number.isFinite(longitude);
  });

  public headerActions = computed(() => [
    { 
      key: 'save', 
      label: this.saving() ? 'Guardando...' : 'Guardar Cambios', 
      icon: 'fa-save',
      color: 'primary',
      typeAction: 'header' as const,
      disabled: this.formInvalid() || this.saving() || this.loading()
    }
  ]);

  constructor() {
    this.configForm = this.fb.group({
      latitude: [null, [Validators.required]],
      longitude: [null, [Validators.required]],
      geofenceRadius: [50, [Validators.required, Validators.min(10)]],
    });
  }

  ngOnInit() {
    this.previewSubscription = this.configForm.valueChanges.subscribe(() => {
      this.syncPreviewFromForm();
      this.queuePreviewRefresh();
    });
    this.formStateSubscription = merge(this.configForm.statusChanges, this.configForm.valueChanges).subscribe(() => {
      this.formInvalid.set(this.configForm.invalid);
    });
    this.formInvalid.set(this.configForm.invalid);
    this.loadConfig();
  }

  ngOnDestroy(): void {
    this.previewSubscription?.unsubscribe();
    this.formStateSubscription?.unsubscribe();
    this.previewMap?.remove();
  }

  loadConfig() {
    this.loading.set(true);
    this.api.getMain().subscribe({
      next: (data) => {
        this.institution.set(data);
        this.configForm.patchValue({
          latitude: data.latitude,
          longitude: data.longitude,
          geofenceRadius: data.geofenceRadius ?? 50,
        });
        this.syncPreviewFromForm();
        this.loading.set(false);
        this.queuePreviewRefresh();
      },
      error: () => this.loading.set(false)
    });
  }

  captureLocation() {
    if (this.isCapturingLocation()) return;

    this.toast.info('Obteniendo ubicación...', { description: 'Geolocalización' });
    this.geoService.startWatching();

    const geoError = this.geolocationError();
    if (geoError) {
      this.toast.error(geoError, { description: 'Geolocalización' });
      return;
    }

    this.currentPosition$
      .pipe(
        filter(pos => !!pos),
        take(1)
      )
      .subscribe(pos => {
        if (pos) {
          this.configForm.patchValue({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          this.syncPreviewFromForm();
          this.queuePreviewRefresh();
          this.geoService.stopWatching();
          this.toast.success('Ubicación capturada', { description: 'Geolocalización' });
        }
      });
  }

  onSubmit() {
    if (this.configForm.invalid || !this.institution()) return;
    
    this.saving.set(true);
    const id = this.institution()!.id;
    this.api.update(id, this.configForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Configuración guardada', { description: 'Éxito' });
      },
      error: () => this.saving.set(false)
    });
  }

  openExternalMap(): void {
    const { latitude, longitude } = this.preview();
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank', 'noopener,noreferrer');
  }

  private syncPreviewFromForm(): void {
    const latitude = this.parseCoordinate(this.configForm.get('latitude')?.value);
    const longitude = this.parseCoordinate(this.configForm.get('longitude')?.value);
    const radiusValue = Number(this.configForm.get('geofenceRadius')?.value);
    const geofenceRadius = Number.isFinite(radiusValue) && radiusValue > 0 ? radiusValue : 50;

    this.preview.set({ latitude, longitude, geofenceRadius });
  }

  private parseCoordinate(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private queuePreviewRefresh(): void {
    setTimeout(() => this.renderPreviewMap(), 0);
  }

  private renderPreviewMap(): void {
    const { latitude, longitude, geofenceRadius } = this.preview();
    const mapEl = document.getElementById('institution-config-preview-map');

    if (!mapEl || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      if (this.previewMap) {
        this.previewMap.remove();
        this.previewMap = undefined;
        this.previewMarker = undefined;
        this.previewCircle = undefined;
        this.previewTiles = undefined;
      }
      return;
    }

    if (!this.previewMap) {
      this.previewMap = L.map(mapEl).setView([latitude, longitude], 17);
      this.previewTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.previewMap);
    } else {
      this.previewMap.setView([latitude, longitude], this.previewMap.getZoom() || 17);
    }

    if (!this.previewMarker) {
      this.previewMarker = L.marker([latitude, longitude]).addTo(this.previewMap);
    } else {
      this.previewMarker.setLatLng([latitude, longitude]);
    }

    if (!this.previewCircle) {
      this.previewCircle = L.circle([latitude, longitude], {
        color: '#b02234',
        fillColor: '#b02234',
        fillOpacity: 0.14,
        radius: geofenceRadius,
      }).addTo(this.previewMap);
    } else {
      this.previewCircle.setLatLng([latitude, longitude]);
      this.previewCircle.setRadius(geofenceRadius);
    }

    this.previewMap.invalidateSize();
  }
}
