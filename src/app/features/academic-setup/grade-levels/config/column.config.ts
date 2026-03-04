import { DataSourceColumn } from '@core/types/data-source-types';

export const GRADE_LEVEL_COLUMN: DataSourceColumn[] = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'level', label: 'Nivel', sortable: true },
  { key: 'gradeNumber', label: 'Número', type: 'number' },
  { key: 'maxCapacity', label: 'Capacidad máx.', type: 'number' },
  { key: 'description', label: 'Descripción', truncate: true, truncateLength: 40 },
];
