import { ActionConfig } from '@core/types/action-types';

export const GRADE_LEVEL_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Nuevo nivel', icon: 'fas fa-plus', typeAction: 'header', color: 'success' },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary' },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary' },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger' },
];
