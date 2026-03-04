import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SubjectArea } from '../types/subject-area-types';
import { Params } from '@angular/router';

type GetAllResponse = SubjectArea[] | { data?: SubjectArea[]; total?: number };
type CreateResponse = { data?: SubjectArea; message?: string };
type FindOneResponse = { data?: SubjectArea; message?: string };

@Injectable({ providedIn: 'root' })
export class SubjectAreaApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'subject-area';

  getAll(params?: Params): Observable<SubjectArea[]> {
    return this.http.get<GetAllResponse>(this.baseUrl, { params }).pipe(
      map((res) => (Array.isArray(res) ? res : res.data ?? [])),
    );
  }

  getById(id: string): Observable<SubjectArea> {
    return this.http.get<FindOneResponse>(`${this.baseUrl}/${id}`).pipe(
      map((res) => ('data' in res && res.data ? res.data : res as unknown as SubjectArea)),
    );
  }

  create(data: Partial<SubjectArea>): Observable<SubjectArea> {
    return this.http.post<CreateResponse>(this.baseUrl, data).pipe(
      map((res) => res.data ?? (res as unknown as SubjectArea)),
    );
  }

  update(id: string, data: Partial<SubjectArea>): Observable<void> {
    return this.http.patch<{ message?: string }>(`${this.baseUrl}/${id}`, data).pipe(
      map(() => undefined),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
