export type User = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

export type UserCreate = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
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
