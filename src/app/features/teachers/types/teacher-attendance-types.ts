export type TeacherAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type TeacherAttendance = {
  id?: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: TeacherAttendanceStatus;
  leaveType: string;
  reason?: string;
  observations?: string;
  supportingDocuments?: string;
  teacher?: { id?: string; teacherCode?: string } | string;
  teacherCode?: string;
};

export type TeacherAttendanceBulkRequest = {
  date: string;
  attendances: {
    teacherCode: string;
    status: TeacherAttendanceStatus;
    observations?: string;
    checkInTime?: string;
  }[];
};

export type TeacherAttendanceBulkResponse = {
  success: boolean;
  message: string;
  processed: number;
  errors?: string[];
};
