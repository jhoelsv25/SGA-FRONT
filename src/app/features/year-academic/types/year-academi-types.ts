// Valores alineados con el backend (API academic-years)
export const Modality = {
  IN_PERSON: 'in-person',
  ONLINE: 'online',
  HYBRID: 'hybrid',
} as const;
export type Modality = (typeof Modality)[keyof typeof Modality];

export const GradingSystem = {
  PERCENTAGE: 'percentage',
  LETTER: 'letter',
  GPA: 'gpa',
} as const;
export type GradingSystem = (typeof GradingSystem)[keyof typeof GradingSystem];

export const AcademicYearStatus = {
  PLANNED: 'planned',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type AcademicYearStatus = (typeof AcademicYearStatus)[keyof typeof AcademicYearStatus];

// Período mínimo cuando viene dentro del año (desde API)
export type YearAcademicPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  periodNumber?: number;
  type?: string;
  status?: string; // 'planned' | 'in_progress' | 'completed' | 'cancelled'
};

// Main type for the form (optional, for typing)
export type YearAcademic = {
  id: string;
  year: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  modality: Modality;
  gradingSystem: GradingSystem;
  passingDate: Date | string;
  passingGrade: string;
  academicCalendarUrl: string;
  status: AcademicYearStatus;
  institution: string | { id: string; name?: string };
  periodCount?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  /** Períodos del año (vienen en GET all / GET by id) */
  periods?: YearAcademicPeriod[];
};

export type YearAcademicFormModel = Omit<YearAcademic, 'id' | 'createdAt' | 'updatedAt'>;

export type YearAcademicResponse = {
  data: YearAcademic;
  message: string;
};
