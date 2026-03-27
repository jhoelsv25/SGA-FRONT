import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Assessment,
  AssessmentUpsertPayload,
  BulkScoreRequest,
  AssessmentScore,
  PeriodCompetencyGrade,
} from '../types/assessment-types';
import { ApiParams, DataResponse } from '@core/types/pagination-types';

@Injectable({ providedIn: 'root' })
export class AssessmentApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'assessments';
  public scoresUrl = 'assessment-scores';

  getAll(params: ApiParams = {}): Observable<DataResponse<Assessment>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<DataResponse<Assessment>>(this.baseUrl, { params: httpParams });
  }

  getById(id: string): Observable<Assessment> {
    return this.http.get<Assessment>(`${this.baseUrl}/${id}`);
  }

  create(data: AssessmentUpsertPayload): Observable<{ data?: Assessment; message?: string }> {
    return this.http.post<{ data?: Assessment; message?: string }>(this.baseUrl, data);
  }

  update(id: string, data: Partial<AssessmentUpsertPayload>): Observable<Assessment | { data?: Assessment; message?: string }> {
    return this.http.patch<Assessment | { data?: Assessment; message?: string }>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  saveScoresBulk(data: BulkScoreRequest): Observable<{ success?: boolean; message?: string; processed?: number }> {
    return this.http.post<{ success?: boolean; message?: string; processed?: number }>(`${this.scoresUrl}/bulk`, data);
  }

  getScoresByAssessment(assessmentId: string): Observable<DataResponse<AssessmentScore>> {
    return this.http.get<DataResponse<AssessmentScore>>(this.scoresUrl, { 
      params: new HttpParams().set('assessment', assessmentId) 
    });
  }

  getConsolidatedGrades(params: {
    enrollment?: string;
    period?: string;
    competency?: string;
    sectionCourse?: string;
    academicYear?: string;
  }): Observable<DataResponse<PeriodCompetencyGrade>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) httpParams = httpParams.set(key, value);
    });
    return this.http.get<DataResponse<PeriodCompetencyGrade>>(`${this.scoresUrl}/consolidated`, {
      params: httpParams,
    });
  }
}
