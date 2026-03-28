export type ReportType = 'academic' | 'attendance' | 'payments' | 'behavior' | 'enrollment' | 'custom' | 'other';
export type ReportFormat = 'pdf' | 'xlsx' | 'csv';

export type ReportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Report = {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  format?: ReportFormat;
  generatedAt?: string;
  downloadUrl?: string;
  createdBy?: string;
  parameters?: Record<string, unknown>;
};

export type AcademicReportParameters = {
  sectionCourse?: string | null;
  period?: string | null;
  competency?: string | null;
  student?: string | null;
};

export type ReportMeta = {
  status?: ReportJobStatus;
  error?: string | null;
  queuedAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  mimeType?: string;
  rows?: number;
};

export type ReportCreate = {
  name: string;
  type: ReportType;
  format?: ReportFormat;
  parameters?: Record<string, unknown>;
};

export type ReportUpdate = Partial<ReportCreate>;

export type ReportResponse = {
  data: Report;
  message: string;
};

export type ReportsListResponse = {
  data: Report[];
  message?: string;
};
