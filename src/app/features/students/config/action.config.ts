import { ActionConfig } from '@core/types/action-types';

export const STUDENT_ACTIONS: ActionConfig[] = [
  {
    key: 'create',
    label: 'Nuevo estudiante',
    icon: 'fas fa-plus',
    typeAction: 'header',
    color: 'success',
    permissions: ['student:create'],
  },
  {
    key: 'downloadTemplate',
    label: 'Plantilla Excel',
    icon: 'fas fa-download',
    typeAction: 'header',
    color: 'secondary',
    permissions: ['student:import'],
  },
  {
    key: 'import',
    label: 'Importar',
    icon: 'fas fa-file-import',
    typeAction: 'header',
    color: 'primary',
    permissions: ['student:import'],
  },
  {
    key: 'export',
    label: 'Exportar',
    icon: 'fas fa-file-export',
    typeAction: 'header',
    color: 'primary',
    permissions: ['student:export'],
  },
  {
    key: 'edit',
    label: 'Editar',
    icon: 'fas fa-edit',
    typeAction: 'row',
    color: 'primary',
    permissions: ['student:update'],
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'fas fa-trash',
    typeAction: 'row',
    color: 'danger',
    permissions: ['student:delete'],
  },
];
