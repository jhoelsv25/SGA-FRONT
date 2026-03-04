import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GradeLevel, GradeLevelCreate, GradeLevelUpdate } from '../../types/grade-level-types';

@Injectable({ providedIn: 'root' })
export class GradeLevelApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'grade-level';

  getAll(): Observable<GradeLevel[]> {
    return this.http.get<GradeLevel[]>(this.baseUrl);
  }

  getById(id: string): Observable<{ data: GradeLevel; message: string }> {
    return this.http.get<{ data: GradeLevel; message: string }>(`${this.baseUrl}/${id}`);
  }

  create(data: GradeLevelCreate): Observable<{ data: GradeLevel; message: string }> {
    return this.http.post<{ data: GradeLevel; message: string }>(this.baseUrl, data);
  }

  update(id: string, data: GradeLevelUpdate): Observable<{ data: GradeLevel; message: string }> {
    return this.http.patch<{ data: GradeLevel; message: string }>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
