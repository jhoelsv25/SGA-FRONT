export interface VirtualClassroomItem {
  id: string;
  platform: string;
  accessUrl?: string;
  type?: string;
  status?: string;
  sectionCourse?: {
    id: string;
    modality?: string;
    maxStudents?: number;
    enrolledStudents?: number;
    status?: string;
    section?: { id: string; name?: string };
    course?: { id: string; name?: string };
    academicYear?: { id: string; name?: string };
    teacher?: {
      id: string;
      teacherCode?: string;
      specialization?: string;
      person?: { firstName?: string; lastName?: string; photoUrl?: string };
    };
  };
}

export interface VirtualClassroomsResponse {
  data: VirtualClassroomItem[];
  page: number;
  size: number;
  total: number;
}
