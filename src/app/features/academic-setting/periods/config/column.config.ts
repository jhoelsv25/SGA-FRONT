import { DataSourceColumn } from '@core/types/data-source-types';

export const PERIOD_COLUMNS: DataSourceColumn[] = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'startDate', label: 'Inicio', type: 'date', sortable: true },
  { key: 'endDate', label: 'Fin', type: 'date', sortable: true },
  { key: 'order', label: 'Orden', type: 'number' },
];
