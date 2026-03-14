export type DashboardRole =
  | 'student'
  | 'teacher'
  | 'admin'
  | 'superadmin'
  | 'director'
  | 'subdirector'
  | 'guardian'
  | 'ugel'
  | 'guest'
  | 'user';

export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  helper?: string;
  icon: string;
  color: string;
}

export interface DashboardLink {
  id: string;
  label: string;
  route: string;
  icon: string;
  color: string;
}

export interface DashboardSectionItem {
  label: string;
  value: string | number;
}

export interface DashboardSection {
  id: string;
  title: string;
  description?: string;
  items: DashboardSectionItem[];
}

export interface DashboardResponse {
  role: DashboardRole;
  roleLabel: string;
  summary: DashboardMetric[];
  quickLinks: DashboardLink[];
  sections: DashboardSection[];
}
