import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiParams, ApiEntityResponse, DataResponse } from '@core/types/pagination-types';
import type {
  Guardian,
  CreateGuardianDto,
  GuardianUpdateDto,
  StudentGuardian,
  CreateStudentGuardianDto,
  StudentGuardianUpdateDto,
} from '../../types/guardian-types';

type BackendResponse<T> = { message?: string; data: T };

@Injectable({ providedIn: 'root' })
export class GuardianApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'guardians';
  private readonly studentGuardiansUrl = 'student-guardians';

  getAll(params: ApiParams = {}): Observable<DataResponse<Guardian>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] != null) httpParams = httpParams.set(key, String(params[key]));
    });
    return this.http.get<BackendResponse<Guardian[]>>(this.baseUrl, { params: httpParams }).pipe(
      map((res) => ({
        data: res.data ?? [],
        page: 1,
        size: (res.data ?? []).length,
        total: (res.data ?? []).length,
      })),
    );
  }

  getById(id: string): Observable<Guardian> {
    return this.http
      .get<BackendResponse<Guardian>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(data: CreateGuardianDto): Observable<ApiEntityResponse<Guardian>> {
    return this.http
      .post<BackendResponse<Guardian>>(this.baseUrl, data)
      .pipe(map((res) => ({ data: res.data })));
  }

  update(id: string, data: GuardianUpdateDto): Observable<ApiEntityResponse<Guardian>> {
    return this.http
      .patch<BackendResponse<Guardian>>(`${this.baseUrl}/${id}`, data)
      .pipe(map((res) => ({ data: res.data })));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // StudentGuardians
  getStudentGuardians(params: ApiParams = {}): Observable<DataResponse<StudentGuardian>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] != null) httpParams = httpParams.set(key, String(params[key]));
    });
    return this.http
      .get<BackendResponse<StudentGuardian[]>>(this.studentGuardiansUrl, { params: httpParams })
      .pipe(
        map((res) => ({
          data: res.data ?? [],
          page: 1,
          size: (res.data ?? []).length,
          total: (res.data ?? []).length,
        })),
      );
  }

  createStudentGuardian(
    data: CreateStudentGuardianDto,
  ): Observable<ApiEntityResponse<StudentGuardian>> {
    return this.http
      .post<BackendResponse<StudentGuardian>>(this.studentGuardiansUrl, data)
      .pipe(map((res) => ({ data: res.data })));
  }

  updateStudentGuardian(
    id: string,
    data: StudentGuardianUpdateDto,
  ): Observable<ApiEntityResponse<StudentGuardian>> {
    return this.http
      .patch<BackendResponse<StudentGuardian>>(`${this.studentGuardiansUrl}/${id}`, data)
      .pipe(map((res) => ({ data: res.data })));
  }

  deleteStudentGuardian(id: string): Observable<void> {
    return this.http.delete<void>(`${this.studentGuardiansUrl}/${id}`);
  }
}
