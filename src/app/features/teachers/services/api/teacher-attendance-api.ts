import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataResponse } from '@core/types/pagination-types';
import {
  TeacherAttendance,
  TeacherAttendanceBulkRequest,
  TeacherAttendanceBulkResponse,
  TeacherAttendanceResponse,
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

  getTeachers(): Observable<{ message: string; data: { id: string; teacherCode: string; specialization: string; firstName?: string; lastName?: string }[] }> {
    return this.http.get<{ message: string; data: { id: string; teacherCode: string; specialization: string; firstName?: string; lastName?: string }[] }>(
      `${this.baseUrl}/teachers`,
    );
  }

  registerBulk(payload: TeacherAttendanceBulkRequest): Observable<TeacherAttendanceBulkResponse> {
    return this.http.post<TeacherAttendanceBulkResponse>(`${this.baseUrl}/bulk`, payload);
  }

  update(id: string, payload: Partial<TeacherAttendance>): Observable<TeacherAttendanceResponse> {
    return this.http.patch<TeacherAttendanceResponse>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
