import { DataSourceColumn } from '@core/types/data-source-types';

export const TEACHER_COLUMN: DataSourceColumn[] = [
  { key: 'firstName', label: 'Nombre', sortable: true },
  { key: 'lastName', label: 'Apellido', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'subject', label: 'Asignatura' },
  { key: 'hireDate', label: 'F. contratación', type: 'date' },
  { key: 'isActive', label: 'Activo', type: 'boolean' },
];
