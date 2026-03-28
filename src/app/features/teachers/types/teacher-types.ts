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
  institution: string | { id: string; name?: string };
  person: string | {
    id: string;
    firstName?: string;
    lastName?: string;
    documentType?: string;
    documentNumber?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    district?: string;
    province?: string;
    department?: string;
    nationality?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    photoUrl?: string;
  };
  credential?: TeacherCredential;
};

export type TeacherCredential = {
  id: string;
  credentialCode: string;
  qrValue: string;
  active: boolean;
  issuedAt?: string | null;
  expiresAt?: string | null;
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
  photoUrl?: string;
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

export type TeacherCredentialResponse = {
  data: TeacherCredential;
  message: string;
};
