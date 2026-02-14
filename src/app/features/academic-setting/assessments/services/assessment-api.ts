import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Assessment, BulkScoreRequest, AssessmentScore } from '../types/assessment-types';
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

  saveScoresBulk(data: BulkScoreRequest): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.scoresUrl}/bulk`, data);
  }

  getScoresByAssessment(assessmentId: string): Observable<DataResponse<AssessmentScore>> {
    return this.http.get<DataResponse<AssessmentScore>>(this.scoresUrl, { 
      params: new HttpParams().set('assessment', assessmentId) 
    });
  }
}
