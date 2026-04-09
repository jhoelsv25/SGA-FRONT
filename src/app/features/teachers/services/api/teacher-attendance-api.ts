import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataResponse } from '@core/types/pagination-types';
import {
  TeacherAttendance,
  TeacherAttendanceBulkRequest,
  TeacherAttendanceBulkResponse,
  TeacherLiveSessionResponse,
  TeacherRealtimeOverviewResponse,
  TeacherScheduleMonitoringRow,
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

  getScheduleMonitoring(
    params: Record<string, string | number | boolean> = {},
  ): Observable<{ message: string; data: TeacherScheduleMonitoringRow[] }> {
    return this.http.get<{ message: string; data: TeacherScheduleMonitoringRow[] }>(
      `${this.baseUrl}/schedule-monitoring`,
      { params },
    );
  }

  getTeacherLiveSession(): Observable<TeacherLiveSessionResponse> {
    return this.http.get<TeacherLiveSessionResponse>(`${this.baseUrl}/teacher/live-session`);
  }

  getRealtimeOverview(): Observable<TeacherRealtimeOverviewResponse> {
    return this.http.get<TeacherRealtimeOverviewResponse>(`${this.baseUrl}/realtime-overview`);
  }

  startTeacherLiveSession(scheduleId: string, spatialContext?: any): Observable<{ message: string; data: unknown }> {
    return this.http.post<{ message: string; data: unknown }>(
      `${this.baseUrl}/teacher/live-session/start`,
      { scheduleId, ...spatialContext },
    );
  }

  finishTeacherLiveSession(
    scheduleId: string,
    justification?: string,
    spatialContext?: any,
  ): Observable<{ message: string; data: unknown }> {
    return this.http.post<{ message: string; data: unknown }>(
      `${this.baseUrl}/teacher/live-session/finish`,
      { scheduleId, justification, ...spatialContext },
    );
  }

  registerBulk(payload: TeacherAttendanceBulkRequest): Observable<TeacherAttendanceBulkResponse> {
    return this.http.post<TeacherAttendanceBulkResponse>(`${this.baseUrl}/bulk`, payload);
  }

  getDailyAttendanceStatus(): Observable<{ message: string; data: any }> {
    return this.http.get<{ message: string; data: any }>(`${this.baseUrl}/daily-status`);
  }

  getAllDaily(params: Record<string, string | number | boolean> = {}): Observable<DataResponse<any>> {
    return this.http.get<DataResponse<any>>(`${this.baseUrl}/daily`, { params });
  }

  markDailyClockIn(spatialContext?: any): Observable<{ message: string; data: any }> {
    return this.http.post<{ message: string; data: any }>(`${this.baseUrl}/daily/clock-in`, spatialContext ?? {});
  }

  markDailyClockOut(spatialContext?: any): Observable<{ message: string; data: any }> {
    return this.http.post<{ message: string; data: any }>(`${this.baseUrl}/daily/clock-out`, spatialContext ?? {});
  }

  update(id: string, payload: Partial<TeacherAttendance>): Observable<TeacherAttendanceResponse> {
    return this.http.patch<TeacherAttendanceResponse>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
