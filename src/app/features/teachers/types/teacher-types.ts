export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  hireDate: string; // ISO date string
  isActive: boolean;
};

export type TeacherCreate = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  hireDate: string; // ISO date string
};

export type TeacherUpdate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  isActive?: boolean;
};

export type TeacherParams = {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  isActive?: boolean;
};

export type TeacherResponse = {
  data: Teacher;
  message: string;
};
