export type ObservationType = 'behavioral' | 'academic' | 'social';

export interface StudentObservation {
  id: string;
  date: string;
  observation: string;
  type: ObservationType;
  followUp: string;
  referral: string;
  isConfidential: boolean;
  student?: { id: string; firstName?: string; lastName?: string; studentCode?: string };
  teacher?: { id: string; teacherCode?: string };
}

export interface CreateStudentObservationDto {
  date: string;
  observation: string;
  type: ObservationType;
  followUp: string;
  referral: string;
  isConfidential: boolean;
  student: string;
  teacher: string;
}

export type StudentObservationUpdateDto = Partial<CreateStudentObservationDto>;
