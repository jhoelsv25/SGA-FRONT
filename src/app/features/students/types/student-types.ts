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
  photoUrl?: string;
  personId?: string;
  institution?: string | { id: string; name?: string };
  credential?: StudentCredential;
};

export type StudentCredential = {
  id: string;
  credentialCode: string;
  qrValue: string;
  active: boolean;
  issuedAt?: string | null;
  expiresAt?: string | null;
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
  photoUrl?: string;
  institution?: string;
  isActive?: boolean;
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

export type StudentCredentialResponse = {
  data: StudentCredential;
  message: string;
};
