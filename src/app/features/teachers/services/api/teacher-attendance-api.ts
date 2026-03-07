import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataResponse } from '@core/types/pagination-types';
import {
  TeacherAttendance,
  TeacherAttendanceBulkRequest,
  TeacherAttendanceBulkResponse,
} from '@features/teachers/types/teacher-attendance-types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeacherAttendanceApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'teacher-attendances';

  getAll(params: Record<string, string | number | boolean> = {}): Observable<DataResponse<TeacherAttendance>> {
    return this.http.get<DataResponse<TeacherAttendance>>(this.baseUrl, { params });
  }

  registerBulk(payload: TeacherAttendanceBulkRequest): Observable<TeacherAttendanceBulkResponse> {
    return this.http.post<TeacherAttendanceBulkResponse>(`${this.baseUrl}/bulk`, payload);
  }
}
