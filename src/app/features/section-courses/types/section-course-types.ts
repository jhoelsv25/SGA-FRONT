export interface SectionCourse {
  id: string;
  modality?: string;
  maxStudents?: number;
  enrolledStudents?: number;
  status?: string;
  section?: { id: string; name?: string };
  course?: { id: string; name?: string };
  academicYear?: { id: string; name?: string };
  teacher?: { id: string; teacherCode?: string; specialization?: string; person?: { firstName?: string; lastName?: string } };
}

export type SectionCourseCreate = {
  modality: string;
  maxStudents: number;
  enrolledStudents: number;
  status: string;
  academicYear: string;
  section: string;
  course: string;
  teacher?: string;
};

export type SectionCourseUpdate = Partial<SectionCourseCreate>;
