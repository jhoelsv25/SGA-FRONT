import { ActionConfig } from '@core/types/action-types';

export const SECTION_ACTIONS: ActionConfig[] = [
  {
    key: 'create',
    label: 'Nueva sección',
    icon: 'fas fa-plus',
    typeAction: 'header',
    color: 'success',
    permission: 'section:create',
  },
  {
    key: 'refresh',
    label: 'Actualizar',
    icon: 'fas fa-sync-alt',
    typeAction: 'header',
    color: 'primary',
    permission: 'section:view',
  },
  {
    key: 'edit',
    label: 'Editar',
    icon: 'fas fa-edit',
    typeAction: 'row',
    color: 'primary',
    permission: 'section:update',
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'fas fa-trash',
    typeAction: 'row',
    color: 'danger',
    permission: 'section:delete',
  },
];
