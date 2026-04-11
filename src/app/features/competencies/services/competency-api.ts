import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiParams, ApiEntityResponse, DataResponse } from '@core/types/pagination-types';
import { Competency } from '../types/competency-types';

type GetAllRes = Competency[] | { data?: Competency[]; message?: string };
type GetOneRes = Competency | { data?: Competency; message?: string };

@Injectable({ providedIn: 'root' })
export class CompetencyApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'competencies';

  getAll(params: ApiParams = {}): Observable<DataResponse<Competency>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const v = params[key];
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(key, String(v));
    });
    return this.http.get<GetAllRes>(this.baseUrl, { params: httpParams }).pipe(
      map((res) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        return { data, page: 1, size: data.length, total: data.length };
      }),
    );
  }

  getById(id: string): Observable<Competency> {
    return this.http
      .get<GetOneRes>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as Competency))));
  }

  create(payload: {
    code: string;
    name: string;
    description?: string;
    expectedAchievement?: string;
    course: string;
  }): Observable<ApiEntityResponse<Competency>> {
    return this.http.post<ApiEntityResponse<Competency>>(this.baseUrl, payload);
  }

  update(
    id: string,
    payload: Partial<{
      code: string;
      name: string;
      description?: string;
      expectedAchievement?: string;
      course: string;
    }>,
  ): Observable<ApiEntityResponse<Competency>> {
    return this.http.patch<ApiEntityResponse<Competency>>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
