import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  public currentPosition = signal<GeolocationPosition | null>(null);
  public error = signal<string | null>(null);
  public errorKind = signal<'permission' | 'unavailable' | 'timeout' | 'unknown' | null>(null);
  public isWatching = signal(false);

  private watchId: number | null = null;
  private readonly watchOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 30000,
  };

  private readonly fallbackOptions: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 120000,
  };

  public startWatching() {
    if (!navigator.geolocation) {
      this.error.set('Geolocalización no soportada por el navegador.');
      this.errorKind.set('unknown');
      return;
    }

    if (this.watchId !== null) return;

    this.isWatching.set(true);
    this.requestCurrentPosition();
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.currentPosition.set(pos);
        this.error.set(null);
        this.errorKind.set(null);
      },
      (err) => {
        this.handlePositionError(err);
      },
      this.watchOptions,
    );
  }

  public stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isWatching.set(false);
    this.currentPosition.set(null);
  }

  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }

  public getGeofenceStatus(targetLat: number, targetLon: number, radius: number): boolean {
    const pos = this.currentPosition();
    if (!pos) return true; // Assume true if no position to not block user, or should it be false?

    const distance = this.calculateDistance(
      pos.coords.latitude,
      pos.coords.longitude,
      targetLat,
      targetLon,
    );

    return distance <= radius;
  }

  public getCurrentContext() {
    const pos = this.currentPosition();
    return {
      latitude: pos?.coords.latitude,
      longitude: pos?.coords.longitude,
      timestamp: pos?.timestamp,
    };
  }

  public requestCurrentPosition() {
    if (!navigator.geolocation) {
      this.error.set('Geolocalización no soportada por el navegador.');
      this.errorKind.set('unknown');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.currentPosition.set(pos);
        this.error.set(null);
        this.errorKind.set(null);
      },
      (err) => {
        if (err.code === 2 || err.code === 3) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              this.currentPosition.set(fallbackPos);
              this.error.set(null);
              this.errorKind.set(null);
            },
            (fallbackErr) => {
              this.handlePositionError(fallbackErr);
            },
            this.fallbackOptions,
          );
          return;
        }

        this.handlePositionError(err);
      },
      this.watchOptions,
    );
  }

  private getFriendlyErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Permiso de ubicación denegado.';
      case 2:
        return 'Ubicación no disponible. El sistema no pudo fijar una posición confiable todavía.';
      case 3:
        return 'Tiempo de espera agotado al obtener ubicación.';
      default:
        return 'Error desconocido de geolocalización.';
    }
  }

  private handlePositionError(err: GeolocationPositionError) {
    if (this.currentPosition()) {
      this.error.set('Se mantiene la última ubicación disponible.');
      this.errorKind.set(null);
      return;
    }

    this.errorKind.set(
      err.code === 1
        ? 'permission'
        : err.code === 2
          ? 'unavailable'
          : err.code === 3
            ? 'timeout'
            : 'unknown',
    );
    this.error.set(this.getFriendlyErrorMessage(err.code));
  }
}
