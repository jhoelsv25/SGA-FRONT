import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { DataResponse } from '@core/types/pagination-types';
import { Teacher, TeacherResponse } from '@features/teachers/types/teacher-types';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeacherApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'teachers';

  getAll(params: Params = {}): Observable<DataResponse<Teacher>> {
    return this.http.get<DataResponse<Teacher>>(`${this.baseUrl}`, { params });
  }

  getById(id: string): Observable<TeacherResponse> {
    return this.http.get<TeacherResponse>(`${this.baseUrl}/${id}`);
  }

  create(teacher: Partial<Teacher>): Observable<TeacherResponse> {
    return this.http.post<TeacherResponse>(`${this.baseUrl}`, teacher);
  }

  update(id: string, teacher: Partial<Teacher>): Observable<TeacherResponse> {
    return this.http.put<TeacherResponse>(`${this.baseUrl}/${id}`, teacher);
  }

  delete(id: string): Observable<TeacherResponse> {
    return this.http.delete<TeacherResponse>(`${this.baseUrl}/${id}`);
  }

  import(rows: Partial<Teacher>[]): Observable<{ created: number; errors?: { row: number; message: string }[] }> {
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
