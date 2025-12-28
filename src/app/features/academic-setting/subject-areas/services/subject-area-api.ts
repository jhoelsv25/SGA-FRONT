import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SubjectArea } from '../types/subject-area-types';
import { Params } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SubjectAreaApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'subject-area';

  getAll(params?: Params): Observable<SubjectArea[]> {
    return this.http.get<SubjectArea[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<SubjectArea> {
    return this.http.get<SubjectArea>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<SubjectArea>): Observable<SubjectArea> {
    return this.http.post<SubjectArea>(this.baseUrl, data);
  }

  update(id: string, data: Partial<SubjectArea>): Observable<SubjectArea> {
    return this.http.patch<SubjectArea>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
