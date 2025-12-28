import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { DataResponse } from '@core/types/pagination-types';

import { Observable } from 'rxjs';
import { YearAcademic, YearAcademicResponse } from '../../types/year-academi-types';

@Injectable({ providedIn: 'root' })
export class YearAcademicApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'academic-years';

  getAll(params: Params): Observable<DataResponse<YearAcademic>> {
    return this.http.get<DataResponse<YearAcademic>>(this.baseUrl, { params });
  }
  getById(id: string): Observable<YearAcademic> {
    return this.http.get<YearAcademic>(`${this.baseUrl}/${id}`);
  }
  create(data: Partial<YearAcademic>): Observable<YearAcademicResponse> {
    return this.http.post<YearAcademicResponse>(this.baseUrl, data);
  }
  update(id: string, data: Partial<YearAcademic>): Observable<YearAcademicResponse> {
    return this.http.put<YearAcademicResponse>(`${this.baseUrl}/${id}`, data);
  }
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
