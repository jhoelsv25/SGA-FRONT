import { DataSourceColumn } from '@core/types/data-source-types';

export const STUDENT_COLUMN: DataSourceColumn[] = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'age', label: 'Edad', type: 'number' },
  { key: 'grade', label: 'Grado' },
];
