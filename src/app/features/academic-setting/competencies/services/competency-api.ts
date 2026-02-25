import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataResponse } from '@core/types/pagination-types';
import { Competency } from '../types/competency-types';

@Injectable({ providedIn: 'root' })
export class CompetencyApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'competencies';

  getAll(): Observable<Competency[]> {
    return this.http
      .get<DataResponse<Competency> | Competency[]>(this.baseUrl)
      .pipe(
        map((res) => (Array.isArray(res) ? res : (res as DataResponse<Competency>).data ?? [])),
      );
  }
}
