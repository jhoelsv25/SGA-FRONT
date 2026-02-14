import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Attendance, BulkAttendanceRequest, AttendanceResponse } from '../types/attendance-types';
import { ApiParams, DataResponse } from '@core/types/pagination-types';

@Injectable({ providedIn: 'root' })
export class AttendanceApi {
  private readonly http = inject(HttpClient);
  public baseUrl = 'attendances';

  getAll(params: ApiParams = {}): Observable<DataResponse<Attendance>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get<DataResponse<Attendance>>(this.baseUrl, { params: httpParams });
  }

  saveBulk(data: BulkAttendanceRequest): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(`${this.baseUrl}/bulk`, data);
  }

  getById(id: string): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.baseUrl}/${id}`);
  }

  getBySectionCourse(sectionCourseId: string, date: string): Observable<DataResponse<Attendance>> {
    const params = new HttpParams()
      .set('sectionCourse', sectionCourseId)
      .set('date', date);
    return this.http.get<DataResponse<Attendance>>(this.baseUrl, { params });
  }
}
