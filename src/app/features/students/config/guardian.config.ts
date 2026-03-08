import { HeaderConfig } from '@core/types/header-types';
import { DataSourceColumn } from '@core/types/data-source-types';
import { ActionConfig } from '@core/types/action-types';

export const GUARDIAN_HEADER_CONFIG: HeaderConfig = {
  title: 'Apoderados',
  subtitle: 'Gestionar vínculos entre estudiantes y apoderados',
  showActions: true,
  showFilters: false,
};

export const GUARDIAN_COLUMN: DataSourceColumn[] = [
  {
    key: 'studentName',
    label: 'Estudiante',
    sortable: true,
  },
  {
    key: 'guardianName',
    label: 'Apoderado',
    sortable: true,
  },
  {
    key: 'relationship',
    label: 'Relación',
    sortable: true,
    valueLabels: {
      parent: 'Padre/Madre',
      guardian: 'Tutor',
      other: 'Otro',
    },
  },
  {
    key: 'isPrimary',
    label: 'Principal',
    type: 'boolean',
    booleanLabels: { true: 'Sí', false: 'No' },
  },
  {
    key: 'emergencyContact',
    label: 'Emergencia',
    type: 'boolean',
    booleanLabels: { true: 'Sí', false: 'No' },
  },
];

export const GUARDIAN_ACTIONS: ActionConfig[] = [
  {
    key: 'create',
    label: 'Vincular apoderado',
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
