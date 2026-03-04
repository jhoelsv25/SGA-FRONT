import { DataSourceColumn } from '@core/types/data-source-types';

export const YEAR_ACADEMIC_COLUMN: DataSourceColumn[] = [
  { key: 'year', label: 'Año', sortable: true, truncate: false },
  { key: 'name', label: 'Nombre', sortable: true, truncate: false },
  { key: 'startDate', label: 'F. de Inicio', sortable: true, truncate: false },
  { key: 'endDate', label: 'F. de Fin', sortable: true, truncate: false },
  { key: 'modality', label: 'Modalidad', sortable: true, truncate: false },
  {
    key: 'academicCalendarUrl',
    label: 'URL',
    sortable: false,
    truncate: false,
    truncateLength: 30,
  },
  { key: 'status', label: 'Estado', sortable: true },
];
