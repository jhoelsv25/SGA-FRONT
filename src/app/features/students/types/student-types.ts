export type Student = {
  id: string;
  name: string;
  email: string;
  age: number;
  grade: string;
};
export type StudentCreate = {
  name: string;
  email: string;
  age: number;
  grade: string;
};
export type StudentUpdate = {
  name?: string;
  email?: string;
  age?: number;
  grade?: string;
};
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
