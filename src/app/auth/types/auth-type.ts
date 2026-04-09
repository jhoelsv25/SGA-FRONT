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

export interface CurrentUserPerson {
  id?: string;
  firstName?: string;
  lastName?: string;
  documentType?: string;
  documentNumber?: string;
  birthDate?: string;
  gender?: string;
  birthPlace?: string;
  nationality?: string;
  address?: string;
  district?: string;
  province?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  photoUrl?: string;
}

export interface CurrentUserProfile {
  type: 'admin' | 'superadmin' | 'director' | 'subdirector' | 'teacher' | 'student' | 'guardian' | 'ugel' | 'guest' | 'user';
  roleLabel: string;
  code?: string;
  institution?: string | null;
  institutionId?: string | null;
  institutionName?: string | null;
  details?: Record<string, unknown>;
  stats?: Record<string, unknown>;
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
  teacherId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  isActive: boolean;
  lastLogin: null;
  profilePicture?: string;
  role: RoleAuth;
  code?: string; // Optional user code (e.g., "A-123")
  person?: CurrentUserPerson;
  profile?: CurrentUserProfile;
  stats?: {
    courses?: number;
    students?: number;
    average?: string;
  };
};

export interface UserPermission {
  id: string;
  name: string;
  description?: string;
}

export interface AccountUserDetail extends Omit<CurrentUser, 'lastLogin' | 'role'> {
  status?: string;
  lastLogin?: string | null;
  failedLoginAttempts?: number;
  createdAt?: string;
  updatedAt?: string;
  role: RoleAuth & {
    permissions?: UserPermission[];
  };
}

export interface AccountAuditLog {
  id: string;
  userId: string | null;
  entity: string;
  entityId: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountAuditResponse {
  data: AccountAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AccountSession {
  id: string;
  sessionToken: string;
  expiresAt: string;
  lastActive: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSessionResponse {
  data: AccountSession[];
  total: number;
}

export interface AccountEmailLog {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface AccountEmailLogResponse {
  data: AccountEmailLog[];
  total: number;
}

export interface AccountUserPreferences {
  id: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSystemSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface RoleResponse {
  role: RoleAuth;
  modules: Module[];
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  path?: string;
  icon?: string;
  order?: number;
  visibility?: 'public' | 'private';
  isActive?: boolean;
  isSystem?: boolean;
  permissions: string[];
  children?: Module[];
}
