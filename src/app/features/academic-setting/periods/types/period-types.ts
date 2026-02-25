export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  order?: number;
  yearAcademic?: { id: string; name: string };
}

export type PeriodCreate = Omit<Period, 'id'> & { yearAcademic?: string };
