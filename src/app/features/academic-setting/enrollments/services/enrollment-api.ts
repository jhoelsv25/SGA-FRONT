import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiParams, ApiEntityResponse, DataResponse } from '@core/types/pagination-types';
import { Enrollment } from '../types/enrollment-types';

@Injectable({ providedIn: 'root' })
export class EnrollmentApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'enrollments';

  getAll(params: ApiParams = {}): Observable<DataResponse<Enrollment>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<DataResponse<Enrollment>>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Enrollment> {
    return this.http.get<Enrollment>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Enrollment>): Observable<ApiEntityResponse<Enrollment>> {
    return this.http.post<ApiEntityResponse<Enrollment>>(this.baseUrl, data);
  }

  update(id: string, data: Partial<Enrollment>): Observable<ApiEntityResponse<Enrollment>> {
    return this.http.patch<ApiEntityResponse<Enrollment>>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
