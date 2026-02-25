import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import {
  ReportCreate,
  ReportResponse,
  ReportsListResponse,
  ReportUpdate,
} from '../types/report-types';

@Injectable({ providedIn: 'root' })
export class ReportApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'reports';

  getAll(params?: Params): Observable<ReportsListResponse> {
    return this.http.get<ReportsListResponse>(this.baseUrl, { params: params ?? {} });
  }

  getById(id: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.baseUrl}/${id}`);
  }

  create(data: ReportCreate): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.baseUrl, data);
  }

  update(id: string, data: ReportUpdate): Observable<ReportResponse> {
    return this.http.patch<ReportResponse>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
