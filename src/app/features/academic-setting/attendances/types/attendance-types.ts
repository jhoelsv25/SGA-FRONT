export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  id?: string;
  date: string;
  sessionType: 'lecture' | 'lab' | 'seminar' | 'workshop';
  status: AttendanceStatus;
  checkInTime: string;
  checkOutTime?: string;
  observations?: string;
  enrollmentId: string;
  sectionCourseId: string;
  studentName?: string; // Para mostrar en el UI
}

export interface BulkAttendanceRequest {
  sectionCourseId: string;
  date: string;
  sessionType: string;
  attendances: Partial<Attendance>[];
}

export interface AttendanceResponse {
  success: boolean;
  message: string;
  processed: number;
}
