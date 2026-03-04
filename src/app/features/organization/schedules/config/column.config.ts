import { DataSourceColumn } from '@core/types/data-source-types';

export const SCHEDULE_COLUMN: DataSourceColumn[] = [
  { key: 'title', label: 'Título', sortable: true },
  { key: 'dayOfWeek', label: 'Día', sortable: true },
  { key: 'startAt', label: 'Inicio', type: 'time' },
  { key: 'endAt', label: 'Fin', type: 'time' },
  { key: 'classroom', label: 'Aula' },
  { key: 'description', label: 'Descripción', truncate: true, truncateLength: 30 },
];
