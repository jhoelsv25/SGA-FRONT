export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  docType: string;
  docNumber: string;
  gender: 'M' | 'F' | 'O';
  birthDate: string;
  phone?: string;
  address?: string;
  email: string;
  username: string;
  studentCode: string;
  age: number;
  grade: string;
  isActive: boolean;
};

export type StudentCreate = {
  firstName: string;
  lastName: string;
  docType: string;
  docNumber: string;
  gender: 'M' | 'F' | 'O';
  birthDate: string;
  phone?: string;
  address?: string;
  email: string;
  username: string;
  password?: string;
  studentCode: string;
  age: number;
  grade: string;
};

export type StudentUpdate = Partial<StudentCreate> & { isActive?: boolean };
export type StudentParams = {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
};
export type StudentResponse = {
  data: Student;
  message: string;
};
