import { ActionConfig } from '@core/types/action-types';

export const GRADE_LEVEL_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Nuevo grado', icon: 'fas fa-plus', typeAction: 'header', color: 'success', permissions: ['grade_level:create'] },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary', permissions: ['grade_level:view'] },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary', permissions: ['grade_level:update'] },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger', permissions: ['grade_level:delete'] }];
