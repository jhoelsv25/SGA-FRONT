import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Course } from '../types/course-types';
import { ApiParams, ApiEntityResponse, DataResponse } from '@core/types/pagination-types';

@Injectable({ providedIn: 'root' })
export class CourseApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'courses';

  getAll(params: ApiParams = {}): Observable<DataResponse<Course>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<DataResponse<Course>>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/${id}`);
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
