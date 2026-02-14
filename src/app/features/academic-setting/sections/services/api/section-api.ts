import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import {
  SectionCreate,
  SectionResponse,
  SectionsListResponse,
  SectionUpdate,
} from '../../types/section-types';

@Injectable({ providedIn: 'root' })
export class SectionApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'sections';

  getAll(params?: Params): Observable<SectionsListResponse> {
    return this.http.get<SectionsListResponse>(this.baseUrl, { params: params ?? {} });
  }

  getById(id: string): Observable<SectionResponse> {
    return this.http.get<SectionResponse>(`${this.baseUrl}/${id}`);
  }

  create(data: SectionCreate): Observable<SectionResponse> {
    return this.http.post<SectionResponse>(this.baseUrl, data);
  }

  update(id: string, data: SectionUpdate): Observable<SectionResponse> {
    return this.http.patch<SectionResponse>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
