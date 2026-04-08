export type TeacherAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type TeacherScheduleComplianceStatus =
  | 'pending'
  | 'fulfilled'
  | 'partial'
  | 'unfulfilled'
  | 'reprogrammed';

export type TeacherAttendance = {
  id?: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  status: TeacherAttendanceStatus;
  complianceStatus?: TeacherScheduleComplianceStatus;
  leaveType: string;
  reason?: string;
  justification?: string;
  observations?: string;
  supportingDocuments?: string;
  teacher?: { id?: string; teacherCode?: string } | string;
  teacherCode?: string;
  schedule?: { id?: string } | string;
  sectionCourse?: { id?: string } | string;
};

export type TeacherAttendanceBulkRequest = {
  date: string;
  attendances: {
    teacherCode?: string;
    teacherId?: string;
    scheduleId?: string;
    sectionCourseId?: string;
    status: TeacherAttendanceStatus;
    observations?: string;
    checkInTime?: string;
    checkOutTime?: string;
    plannedStartTime?: string;
    plannedEndTime?: string;
    justification?: string;
    complianceStatus?: TeacherScheduleComplianceStatus;
  }[];
};

export type TeacherAttendanceBulkResponse = {
  success: boolean;
  message: string;
  processed: number;
  errors?: string[];
};

export type TeacherAttendanceResponse = {
  message: string;
  data: TeacherAttendance;
};

export type TeacherScheduleMonitoringRow = {
  scheduleId: string;
  attendanceId: string | null;
  date: string;
  dayOfWeek: string;
  title: string;
  classroom: string;
  description?: string;
  courseName: string;
  sectionName: string;
  teacherId: string | null;
  teacherCode: string;
  teacherName: string;
  sectionCourseId: string | null;
  plannedStartTime: string | null;
  plannedEndTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  plannedMinutes: number;
  actualMinutes: number;
  compliancePercentage: number;
  complianceStatus: TeacherScheduleComplianceStatus;
  attendanceStatus: TeacherAttendanceStatus;
  justification?: string;
  observations?: string;
};

export type TeacherLiveSessionItem = {
  scheduleId: string;
  attendanceId: string | null;
  date: string;
  title: string;
  classroom: string;
  description?: string;
  courseName: string;
  sectionName: string;
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  complianceStatus: TeacherScheduleComplianceStatus;
  progressPercentage: number;
  plannedMinutes: number;
  actualMinutes: number;
  state: 'upcoming' | 'ready' | 'ongoing' | 'finished' | 'missed';
  startsInMinutes: number;
  endsInMinutes: number;
  actionEnabled: boolean;
};

export type TeacherLiveSessionResponse = {
  message: string;
  data: {
    serverTime: string;
    current: TeacherLiveSessionItem | null;
    upcoming: TeacherLiveSessionItem | null;
    sessions: TeacherLiveSessionItem[];
  };
};

export type TeacherRealtimeOverviewResponse = {
  message: string;
  data: {
    serverTime: string;
    counts: {
      ongoing: number;
      ready: number;
      upcoming: number;
      missed: number;
      finished: number;
    };
    activeTeachers: Array<{
      scheduleId: string;
      teacherId: string;
      teacherName: string;
      teacherCode: string;
      courseName: string;
      sectionName: string;
      classroom: string;
      progressPercentage: number;
      endsInMinutes: number;
    }>;
  };
};
