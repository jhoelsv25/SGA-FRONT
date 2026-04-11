import { DataSourceColumn } from '@core/types/data-source-types';

export const ENROLLMENT_COLUMN: DataSourceColumn[] = [
  { key: 'studentName', label: 'Estudiante', sortable: true },
  { key: 'sectionName', label: 'Sección', sortable: true },
  { key: 'enrollmentType', label: 'Tipo', sortable: true },
  {
    key: 'status',
    label: 'Estado',
    sortable: true,
    valueLabels: {
      enrolled: 'Matriculado',
      completed: 'Completado',
      dropped: 'Retirado',
      graduated: 'Egresado',
    },
    valueColors: {
      enrolled: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-blue-100 text-blue-700',
      dropped: 'bg-rose-100 text-rose-700',
      graduated: 'bg-slate-100 text-slate-700',
    },
  },
  { key: 'enrollmentDate', label: 'Fecha', type: 'date', format: 'short', sortable: true },
];
