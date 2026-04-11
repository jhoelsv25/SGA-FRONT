import { DataSourceColumn } from '@core/types/data-source-types';

export const BEHAVIOR_COLUMN: DataSourceColumn[] = [
  { key: 'studentName', label: 'Estudiante', sortable: true },
  { key: 'category', label: 'Categoría', sortable: true },
  { key: 'type', label: 'Tipo', sortable: true },
  { key: 'recordDate', label: 'Fecha', sortable: true, type: 'date' },
  { key: 'place', label: 'Lugar' },
  { key: 'description', label: 'Descripción', truncate: true, truncateLength: 60 },
];
