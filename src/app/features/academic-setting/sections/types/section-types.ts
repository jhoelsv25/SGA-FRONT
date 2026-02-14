export type SectionShift = 'morning' | 'afternoon' | 'evening';
export type StatusType = string;

export type Section = {
  id: string;
  name: string;
  capacity?: number;
  status?: StatusType;
  shift?: SectionShift;
  tutor?: string;
  classroom?: string;
  availableSlots?: number;
  grade?: string | { id: string };
  yearAcademic?: string | { id: string };
};

export type SectionCreate = {
  name: string;
  capacity?: number;
  status?: StatusType;
  shift?: SectionShift;
  tutor?: string;
  classroom?: string;
  availableSlots?: number;
  grade: string;
  yearAcademic: string;
};

export type SectionUpdate = Partial<SectionCreate>;

export type SectionResponse = {
  data: Section;
  message: string;
};

export type SectionsListResponse = {
  data: Section[];
  message?: string;
};
