import { ActionConfig } from '@core/types/action-types';

export const SUBJECT_AREAS_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Crear', icon: 'fa-plus', color: 'success', typeAction: 'header' },
  { key: 'edit', label: 'Editar', icon: 'fa-edit', color: 'primary', typeAction: 'row' },
  { key: 'delete', label: 'Eliminar', icon: 'fa-trash', color: 'danger', typeAction: 'row' },
];
