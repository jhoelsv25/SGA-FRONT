import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Course } from '../types/course-types';
import { ApiParams, ApiEntityResponse, DataResponse } from '@core/types/pagination-types';

type GetAllRes = Course[] | { data?: Course[]; message?: string };
type GetOneRes = Course | { data?: Course; message?: string };

@Injectable({ providedIn: 'root' })
export class CourseApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'courses';

  getAll(params: ApiParams = {}): Observable<DataResponse<Course>> {
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

  getById(id: string): Observable<Course> {
    return this.http
      .get<GetOneRes>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => ('data' in res && res.data ? res.data : (res as Course))));
  }

  create(course: Partial<Course>): Observable<ApiEntityResponse<Course>> {
    return this.http.post<ApiEntityResponse<Course>>(this.baseUrl, course);
  }

  update(id: string, course: Partial<Course>): Observable<ApiEntityResponse<Course>> {
    return this.http.patch<ApiEntityResponse<Course>>(`${this.baseUrl}/${id}`, course);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
