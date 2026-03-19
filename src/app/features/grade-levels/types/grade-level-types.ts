export type Level = 'primary' | 'secondary' | 'higher';

export type GradeLevel = {
  id: string;
  level: Level;
  gradeNumber: number;
  name: string;
  description?: string;
  maxCapacity: number;
  institution?: string | { id: string };
};

export type GradeLevelCreate = {
  level: Level;
  gradeNumber: number;
  name: string;
  description?: string;
  maxCapacity: number;
  institution: string;
};

export type GradeLevelUpdate = Partial<GradeLevelCreate>;
