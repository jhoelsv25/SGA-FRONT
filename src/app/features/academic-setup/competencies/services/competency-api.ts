import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiParams, ApiEntityResponse, DataResponse } from '@core/types/pagination-types';
import { Competency } from '../types/competency-types';

@Injectable({ providedIn: 'root' })
export class CompetencyApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'competencies';

  getAll(params: ApiParams = {}): Observable<DataResponse<Competency>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<DataResponse<Competency>>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Competency> {
    return this.http.get<Competency>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Competency>): Observable<ApiEntityResponse<Competency>> {
    return this.http.post<ApiEntityResponse<Competency>>(this.baseUrl, data);
  }

  update(id: string, data: Partial<Competency>): Observable<ApiEntityResponse<Competency>> {
    return this.http.patch<ApiEntityResponse<Competency>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
