import { ActionConfig } from '@core/types/action-types';

export const PERIOD_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Nuevo período', icon: 'fas fa-plus', typeAction: 'header', color: 'success', permissions: ['academic_period:create'] },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary', permissions: ['academic_period:view'] },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary', permissions: ['academic_period:update'] },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger', permissions: ['academic_period:delete'] }];
