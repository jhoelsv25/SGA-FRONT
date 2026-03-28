import { ActionConfig } from '@core/types/action-types';

export const ASSESSMENT_ACTIONS: ActionConfig[] = [
  {
    key: 'refresh',
    label: 'Actualizar',
    icon: 'fas fa-sync-alt',
    typeAction: 'header',
    color: 'secondary',
  },
  {
    key: 'create',
    label: 'Nueva Evaluación',
    icon: 'fas fa-plus',
    typeAction: 'header',
    permissions: ['assessment:create'],
    color: 'primary',
  },
  {
    key: 'edit',
    label: 'Editar',
    icon: 'fas fa-edit',
    typeAction: 'row',
    permissions: ['assessment:update'],
    color: 'secondary',
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'fas fa-trash',
    typeAction: 'row',
    permissions: ['assessment:delete'],
    color: 'danger',
  }];
