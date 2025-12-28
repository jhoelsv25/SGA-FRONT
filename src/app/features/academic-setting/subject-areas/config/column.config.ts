import { DataSourceColumn } from '@core/types/data-source-types';

export const SUBJECT_AREAS_COLUMN: DataSourceColumn[] = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'description', label: 'Descripción', sortable: false },
  { key: 'type', label: 'Tipo', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
];
