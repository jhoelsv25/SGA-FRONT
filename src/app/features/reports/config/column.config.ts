import { DataSourceColumn } from '@core/types/data-source-types';

export const REPORT_COLUMN: DataSourceColumn[] = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'type', label: 'Tipo', sortable: true },
  { key: 'format', label: 'Formato' },
  { key: 'generatedAt', label: 'Generado', sortable: true, type: 'datetime' },
];
