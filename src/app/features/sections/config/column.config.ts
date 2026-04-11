import { DataSourceColumn } from '@core/types/data-source-types';

export const SECTION_COLUMN: DataSourceColumn[] = [
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'capacity', label: 'Capacidad', type: 'number' },
  { key: 'shift', label: 'Turno', sortable: true },
  { key: 'tutor', label: 'Tutor' },
  { key: 'classroom', label: 'Aula' },
  { key: 'availableSlots', label: 'Cupos disponibles', type: 'number' },
  { key: 'status', label: 'Estado' },
];
