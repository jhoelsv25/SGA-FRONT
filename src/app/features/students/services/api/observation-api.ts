import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiParams, ApiEntityResponse, DataResponse } from '@core/types/pagination-types';
import type {
  StudentObservation,
  CreateStudentObservationDto,
  StudentObservationUpdateDto,
} from '../../types/observation-types';

type BackendResponse<T> = { message?: string; data: T };

@Injectable({ providedIn: 'root' })
export class ObservationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'student-observations';

  getAll(params: ApiParams = {}): Observable<DataResponse<StudentObservation>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] != null) httpParams = httpParams.set(key, String(params[key]));
    });
    return this.http
      .get<BackendResponse<StudentObservation[]>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((res) => ({
          data: res.data ?? [],
          page: 1,
          size: (res.data ?? []).length,
          total: (res.data ?? []).length,
        })),
      );
  }

  getById(id: string): Observable<StudentObservation> {
    return this.http
      .get<BackendResponse<StudentObservation>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(data: CreateStudentObservationDto): Observable<ApiEntityResponse<StudentObservation>> {
    return this.http
      .post<BackendResponse<StudentObservation>>(this.baseUrl, data)
      .pipe(map((res) => ({ data: res.data })));
  }

  update(
    id: string,
    data: StudentObservationUpdateDto,
  ): Observable<ApiEntityResponse<StudentObservation>> {
    return this.http
      .patch<BackendResponse<StudentObservation>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((res) => ({ data: res.data })));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
