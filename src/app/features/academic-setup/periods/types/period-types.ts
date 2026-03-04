/** Valores de estado del período (alineados con backend) */
export const PeriodStatus = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type PeriodStatus = (typeof PeriodStatus)[keyof typeof PeriodStatus];

export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  order?: number;
  periodNumber?: number; // viene del backend en GET all
  status?: PeriodStatus;
  type?: string;
  yearAcademic?: { id: string; name: string };
}

export type PeriodCreate = Omit<Period, 'id'> & { yearAcademic?: string };
