export interface Course {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly weeklyHours: number;
  readonly totalHours: number;
  readonly credits: number;
  readonly isMandatory: boolean;
  readonly syllabusUrl: string;
  readonly subjectArea: { id: string; name: string };
  readonly grade: { id: string; name: string };
  readonly active: boolean;
}
