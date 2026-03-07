export type Teacher = {
  id: string;
  teacherCode: string;
  specialization: string;
  professionalTitle: string;
  university: string;
  graduationYear: number;
  professionalLicense: string;
  contractType: TeacherContractType;
  laborRegime: TeacherLaborRegime;
  hireDate: string;
  terminationDate?: string | null;
  workloadType: TeacherWorkloadType;
  weeklyHours: number;
  teachingLevel: string;
  employmentStatus: TeacherEmploymentStatus;
  institution: string | { id: string };
  person: string | { id: string };
};

export type TeacherContractType = 'full_time' | 'part_time' | 'temporary' | 'permanent';
export type TeacherLaborRegime = 'public' | 'private';
export type TeacherWorkloadType = '20_hours' | '30_hours' | '40_hours';
export type TeacherEmploymentStatus = 'active' | 'inactive' | 'on_leave';

export type TeacherCreate = {
  teacherCode: string;
  specialization: string;
  professionalTitle: string;
  university: string;
  graduationYear: number;
  professionalLicense: string;
  contractType: TeacherContractType;
  laborRegime: TeacherLaborRegime;
  hireDate: string;
  terminationDate?: string;
  workloadType: TeacherWorkloadType;
  weeklyHours: number;
  teachingLevel: string;
  employmentStatus: TeacherEmploymentStatus;
  institution: string;
  person: string;
};
export type TeacherUpdate = Partial<TeacherCreate>;

export type TeacherParams = {
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  contractType?: TeacherContractType;
  laborRegime?: TeacherLaborRegime;
  workloadType?: TeacherWorkloadType;
  employmentStatus?: TeacherEmploymentStatus;
};

export type TeacherResponse = {
  data: Teacher;
  message: string;
};
