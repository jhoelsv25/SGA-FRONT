export type ReportType = 'academic' | 'attendance' | 'payments' | 'behavior' | 'enrollment' | 'custom' | 'other';
export type ReportFormat = 'pdf' | 'xlsx' | 'csv';

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
