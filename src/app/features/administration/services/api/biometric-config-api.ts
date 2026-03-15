import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BiometricConfig {
  id?: string;
  ip: string;
  port: number;
  timeout: number;
  inport: number;
  isActive: boolean;
}

export interface BiometricStatus {
  connected: boolean;
  ip: string | null;
  port: number | null;
  checkedAt: string;
}

@Injectable({ providedIn: 'root' })
export class BiometricConfigApi {
  private readonly http = inject(HttpClient);
  static readonly basePath = 'administration/biometric-config';

  get(): Observable<BiometricConfig | null> {
    return this.http.get<BiometricConfig | null>(BiometricConfigApi.basePath);
  }

  update(payload: BiometricConfig): Observable<BiometricConfig> {
    return this.http.put<BiometricConfig>(BiometricConfigApi.basePath, payload);
  }

  status(): Observable<BiometricStatus> {
    return this.http.get<BiometricStatus>(`${BiometricConfigApi.basePath}/status`);
  }
}
