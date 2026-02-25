import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { DataResponse } from '@core/types/pagination-types';
import { Teacher, TeacherResponse } from '@features/teachers/types/teacher-types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeacherApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'teachers';

  getAll(params: Params = {}): Observable<DataResponse<Teacher>> {
    return this.http.get<DataResponse<Teacher>>(`${this.baseUrl}`, { params });
  }

  getById(id: string): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.baseUrl}/${id}`);
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

  /** Importación masiva. Backend recibe JSON array. */
  import(rows: Partial<Teacher>[]): Observable<{ created: number; errors?: { row: number; message: string }[] }> {
    return this.http.post<{ created: number; errors?: { row: number; message: string }[] }>(
      `${this.baseUrl}/import`,
      { rows },
    );
  }
}
