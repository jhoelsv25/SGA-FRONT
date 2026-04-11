import { HeaderConfig } from '@core/types/header-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { ActionConfig } from '@core/types/action-types';

export const OBSERVATION_HEADER_CONFIG: HeaderConfig = {
  title: 'Observaciones',
  subtitle: 'Registro de observaciones sobre estudiantes',
  showActions: true,
  showFilters: false,
};

export const OBSERVATION_COLUMN: DataSourceColumn[] = [
  {
    key: 'studentName',
    label: 'Estudiante',
    sortable: true,
  },
  {
    key: 'date',
    label: 'Fecha',
    type: 'date',
    format: 'short',
    sortable: true,
  },
  {
    key: 'type',
    label: 'Tipo',
    sortable: true,
    valueLabels: {
      behavioral: 'Conducta',
      academic: 'Académico',
      social: 'Social',
    },
  },
  {
    key: 'observationText',
    label: 'Observación',
    truncate: true,
    truncateLength: 60,
  },
  {
    key: 'teacherName',
    label: 'Docente',
    sortable: true,
  },
];

export const OBSERVATION_ACTIONS: ActionConfig[] = [
  {
    key: 'create',
    label: 'Nueva observación',
    icon: 'fas fa-plus',
    typeAction: 'header',
    color: 'success',
  },
  {
    key: 'refresh',
    label: 'Actualizar',
    icon: 'fas fa-sync-alt',
    typeAction: 'header',
    color: 'primary',
  },
  {
    key: 'edit',
    label: 'Editar',
    icon: 'fas fa-edit',
    typeAction: 'row',
    color: 'primary',
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'fas fa-trash',
    typeAction: 'row',
    color: 'danger',
  },
];
