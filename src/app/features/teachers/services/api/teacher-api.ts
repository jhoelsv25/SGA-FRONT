import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { DataResponse } from '@core/types/pagination-types';
import {
  Teacher,
  TeacherCredentialResponse,
  TeacherResponse,
} from '@features/teachers/types/teacher-types';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeacherApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'teachers';

  getAll(params: Params = {}): Observable<DataResponse<Teacher>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (value === 'undefined' || value === 'null') return;
      httpParams = httpParams.set(key, String(value));
    });
    return this.http.get<DataResponse<Teacher>>(`${this.baseUrl}`, { params: httpParams });
  }

  getById(id: string): Observable<TeacherResponse> {
    return this.http.get<TeacherResponse>(`${this.baseUrl}/${id}`);
  }

  getCredential(id: string): Observable<TeacherCredentialResponse> {
    return this.http.get<TeacherCredentialResponse>(`${this.baseUrl}/${id}/credential`);
  }

  create(teacher: Partial<Teacher>): Observable<TeacherResponse> {
    return this.http.post<TeacherResponse>(`${this.baseUrl}`, teacher);
  }

  update(id: string, teacher: Partial<Teacher>): Observable<TeacherResponse> {
    return this.http.put<TeacherResponse>(`${this.baseUrl}/${id}`, teacher);
  }

  regenerateCredential(id: string): Observable<TeacherCredentialResponse> {
    return this.http.post<TeacherCredentialResponse>(
      `${this.baseUrl}/${id}/credential/regenerate`,
      {},
    );
  }

  delete(id: string): Observable<TeacherResponse> {
    return this.http.delete<TeacherResponse>(`${this.baseUrl}/${id}`);
  }

  import(
    rows: Partial<Teacher>[],
  ): Observable<{ created: number; errors?: { row: number; message: string }[] }> {
    if (rows.length === 0) return of({ created: 0, errors: [] });

    return forkJoin(
      rows.map((row, index) =>
        this.create(row).pipe(
          map(() => ({ ok: true as const })),
          catchError((error) =>
            of({
              ok: false as const,
              error: error?.error?.message ?? error?.message ?? 'Error al crear docente',
              row: index,
            }),
          ),
        ),
      ),
    ).pipe(
      map((results) => {
        const errors: { row: number; message: string }[] = [];
        results.forEach((result) => {
          if (!result.ok) {
            errors.push({ row: result.row, message: result.error });
          }
        });
        return {
          created: results.length - errors.length,
          errors,
        };
      }),
    );
  }
}
