import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Schedule, ScheduleCreate, ScheduleUpdate } from '../../types/schedule-types';

@Injectable({ providedIn: 'root' })
export class ScheduleApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'schedules';

  getAll(params?: Record<string, string | number | boolean>): Observable<Schedule[]> {
    const httpParams = params ? new HttpParams({ fromObject: params as Record<string, string> }) : undefined;
    return this.http.get<Schedule[]>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.baseUrl}/${id}`);
  }

  create(data: ScheduleCreate): Observable<Schedule> {
    return this.http.post<Schedule>(this.baseUrl, data);
  }

  update(id: string, data: ScheduleUpdate): Observable<Schedule> {
    return this.http.patch<Schedule>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
