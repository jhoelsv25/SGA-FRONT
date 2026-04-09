import { ActionConfig } from '@core/types/action-types';

export const ACTION_CONFIG_INSTITUTION: ActionConfig[] = [
  {
    key: 'create',
    label: 'Agregar',
    icon: 'fas fa-plus',
    typeAction: 'header',
    color: 'success',
    permissions: ['institution:create'],
  },
  {
    key: 'config',
    label: 'Configurar Supervisión',
    icon: 'fa-solid fa-gears',
    typeAction: 'header',
    color: 'secondary',
    variant: 'outline',
    permissions: ['institution:update'],
  },
  {
    key: 'edit',
    label: 'Editar',
    icon: 'fas fa-edit',
    typeAction: 'row',
    color: 'primary',
    permissions: ['institution:update'],
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'fas fa-trash',
    typeAction: 'row',
    color: 'danger',
    permissions: ['institution:delete'],
  }];
