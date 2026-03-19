import { ActionConfig } from '@core/types/action-types';

export const COURSES_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Crear curso', icon: 'fas fa-plus', color: 'success', typeAction: 'header', permission: 'manage_course' },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', color: 'primary', typeAction: 'header', permission: 'view_course' },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', color: 'primary', typeAction: 'row', permission: 'manage_course' },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', color: 'danger', typeAction: 'row', permission: 'manage_course' },
];
