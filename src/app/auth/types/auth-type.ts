export type AuthResponse = {
  message: string;
  accessToken: string;
  user: CurrentUser;
  modules: Module[];
};

export type LoginCredentials = {
  username: string;
  password: string;
  rememberMe?: boolean;
};

export type ForgotPasswordData = {
  username: string;
  birthdate: string;
};

export interface RoleAuth {
  id: string;
  name: string;
}
export type RefreshTokenResponse = {
  message: string;
  data: {
    user: CurrentUser;
    accessToken: string;
  };
};
export type CurrentUser = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
  lastLogin: null;
  profilePicture: string;
  role: RoleAuth;
};
export interface RoleResponse {
  role: RoleAuth;
  modules: Module[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  key: string;
  order: number;
  visibility: 'public' | 'private';
  isActive: boolean;
  isSystem: boolean;
  permissions: string[];
  children?: Module[];
}
