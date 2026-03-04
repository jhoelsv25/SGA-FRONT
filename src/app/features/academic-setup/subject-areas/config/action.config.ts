import { ActionConfig } from '@core/types/action-types';

export const SUBJECT_AREAS_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Crear área', icon: 'fas fa-plus', color: 'success', typeAction: 'header' },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', color: 'primary', typeAction: 'header' },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', color: 'primary', typeAction: 'row' },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', color: 'danger', typeAction: 'row' },
];
