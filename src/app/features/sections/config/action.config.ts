import { ActionConfig } from '@core/types/action-types';

export const SECTION_ACTIONS: ActionConfig[] = [
  {
    key: 'create',
    label: 'Nueva sección',
    icon: 'fas fa-plus',
    typeAction: 'header',
    color: 'success',
    permission: 'manage_section',
  },
  {
    key: 'refresh',
    label: 'Actualizar',
    icon: 'fas fa-sync-alt',
    typeAction: 'header',
    color: 'primary',
    permission: 'view_section',
  },
  {
    key: 'edit',
    label: 'Editar',
    icon: 'fas fa-edit',
    typeAction: 'row',
    color: 'primary',
    permission: 'manage_section',
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'fas fa-trash',
    typeAction: 'row',
    color: 'danger',
    permission: 'manage_section',
  },
];
