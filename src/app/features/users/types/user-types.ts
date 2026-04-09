export type User = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName?: string;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  birthDate?: string;
  gender?: string;
  address?: string;
  phone?: string;
  mobile?: string;
};

export type UserCreate = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  phone?: string;
  mobile?: string;
};

export type UserUpdate = {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  password?: string;
};

export type UserParams = {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  isActive?: boolean;
};

export type UserResponse = {
  data: User;
  message: string;
};
