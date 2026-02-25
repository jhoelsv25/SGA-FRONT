import { DataSourceColumn } from '@core/types/data-source-types';

export const BEHAVIOR_COLUMN: DataSourceColumn[] = [
  { key: 'studentName', label: 'Estudiante', sortable: true },
  { key: 'type', label: 'Tipo', sortable: true },
  { key: 'severity', label: 'Severidad', sortable: true },
  { key: 'date', label: 'Fecha', sortable: true, type: 'date' },
  { key: 'description', label: 'Descripción', truncate: true, truncateLength: 60 },
];
