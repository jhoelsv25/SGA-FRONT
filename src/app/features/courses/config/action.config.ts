import { ActionConfig } from '@core/types/action-types';

export const COURSES_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Crear curso', icon: 'fas fa-plus', color: 'success', typeAction: 'header', permission: 'course:create' },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', color: 'primary', typeAction: 'header', permission: 'course:view' },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', color: 'primary', typeAction: 'row', permission: 'course:update' },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', color: 'danger', typeAction: 'row', permission: 'course:delete' },
];
