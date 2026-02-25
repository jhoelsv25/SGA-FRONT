export interface Enrollment {
  id: string;
  code: string;
  enrollmentDate: string;
  enrollmentType: 'new' | 'returning' | 'transfer';
  status: 'enrolled' | 'completed' | 'dropped' | 'graduated';
  orderNumber: number;
  observations?: string;
  student: { id: string; firstName: string; lastName: string; studentCode: string };
  section: { id: string; name: string };
  academicYear: { id: string; year: number };
}

export interface CreateEnrollmentDto {
  student: string;
  section: string;
  academicYear: string;
  enrollmentType: 'new' | 'returning' | 'transfer';
  status: 'enrolled' | 'completed' | 'dropped' | 'graduated';
  enrollmentDate?: string;
  code?: string;
  observations?: string;
}

export type EnrollmentUpdateDto = Partial<CreateEnrollmentDto>;
