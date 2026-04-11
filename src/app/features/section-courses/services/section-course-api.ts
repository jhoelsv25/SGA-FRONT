import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiParams, ApiEntityResponse, DataResponse } from '@core/types/pagination-types';
import type {
  SectionCourse,
  SectionCourseCreate,
  SectionCourseUpdate,
} from '../types/section-course-types';

export type { SectionCourse };

type GetAllRes = SectionCourse[] | { data?: SectionCourse[]; total?: number; message?: string };
type GetOneRes = SectionCourse | { data?: SectionCourse; message?: string };

@Injectable({ providedIn: 'root' })
export class SectionCourseApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'section-course';

  getAll(params: ApiParams = {}): Observable<DataResponse<SectionCourse>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const v = params[key];
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(key, String(v));
    });
    return this.http.get<GetAllRes>(this.baseUrl, { params: httpParams }).pipe(
      map((res) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        const total = Array.isArray(res) ? res.length : (res.total ?? data.length);
        return { data, page: 1, size: data.length, total };
      }),
    );
  }

  getById(id: string): Observable<SectionCourse> {
    return this.http
      .get<GetOneRes>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as SectionCourse))));
  }

  create(payload: SectionCourseCreate): Observable<ApiEntityResponse<SectionCourse>> {
    return this.http.post<ApiEntityResponse<SectionCourse>>(this.baseUrl, payload);
  }

  update(id: string, payload: SectionCourseUpdate): Observable<ApiEntityResponse<SectionCourse>> {
    return this.http.patch<ApiEntityResponse<SectionCourse>>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
