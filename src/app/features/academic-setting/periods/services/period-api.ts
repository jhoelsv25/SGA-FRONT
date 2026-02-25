import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiParams, DataResponse } from '@core/types/pagination-types';
import type { Period } from '../types/period-types';

@Injectable({ providedIn: 'root' })
export class PeriodApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'periods';

  getAll(params: ApiParams = {}): Observable<DataResponse<Period>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const v = params[key];
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(key, String(v));
    });
    return this.http.get<DataResponse<Period>>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Period> {
    return this.http.get<Period>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Period>): Observable<{ data: Period }> {
    return this.http.post<{ data: Period }>(this.baseUrl, data);
  }

  update(id: string, data: Partial<Period>): Observable<{ data: Period }> {
    return this.http.patch<{ data: Period }>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
