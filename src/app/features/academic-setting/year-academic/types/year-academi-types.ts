// Enums for form selects
export enum Modality {
  IN_PERSON = 'IN_PERSON',
  VIRTUAL = 'VIRTUAL',
  HYBRID = 'HYBRID',
}

export enum GradingSystem {
  PERCENTAGE = 'PERCENTAGE',
  LETTER = 'LETTER',
  NUMERIC = 'NUMERIC',
}

export enum AcademicYearStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

// Main type for the form (optional, for typing)
export type YearAcademic = {
  id: string;
  year: number;
  name: string;
  startDate: Date;
  endDate: Date;
  modality: Modality;
  gradingSystem: GradingSystem;
  passingDate: Date;
  passingGrade: number;
  academicCalendarUrl: string;
  status: AcademicYearStatus;
  institution: string;
  createdAt: Date;
  updatedAt: Date;
};

export type YearAcademicFormModel = Omit<YearAcademic, 'id' | 'createdAt' | 'updatedAt'>;

export type YearAcademicResponse = {
  data: YearAcademic;
  message: string;
};
