import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type AccessControlEventType = 'entry' | 'exit';
export type AccessControlPersonType = 'student' | 'teacher';

export type AccessControlEvent = {
  id: string;
  personType: AccessControlPersonType;
  eventType: AccessControlEventType;
  personName: string;
  documentNumber?: string;
  entityCode?: string;
  eventAt: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  isWithinGeofence?: boolean;
  suggestedNextEventType?: AccessControlEventType;
};

export type AccessControlResolvedPerson = {
  personType: AccessControlPersonType;
  personName: string;
  documentNumber?: string;
  entityCode?: string;
  lastEventType?: AccessControlEventType | null;
  lastEventAt?: string | null;
  suggestedEventType: AccessControlEventType;
};

@Injectable({ providedIn: 'root' })
export class AccessControlApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'access-control-events';

  getAll(params: Record<string, string | number | boolean> = {}): Observable<{ message: string; data: AccessControlEvent[] }> {
    return this.http.get<{ message: string; data: AccessControlEvent[] }>(this.baseUrl, { params });
  }

  resolve(code: string): Observable<{ message: string; data: AccessControlResolvedPerson }> {
    return this.http.get<{ message: string; data: AccessControlResolvedPerson }>(`${this.baseUrl}/resolve`, {
      params: { code },
    });
  }

  register(payload: {
    code: string;
    eventType: AccessControlEventType;
    notes?: string;
    latitude?: number;
    longitude?: number;
    isWithinGeofence?: boolean;
  }): Observable<{ message: string; data: AccessControlEvent }> {
    return this.http.post<{ message: string; data: AccessControlEvent }>(this.baseUrl, payload);
  }
}
