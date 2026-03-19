import { ActionConfig } from '@core/types/action-types';

export const COMPETENCIES_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Crear competencia', icon: 'fas fa-plus', color: 'success', typeAction: 'header', permissions: ['manage_competency'] },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', color: 'primary', typeAction: 'header', permissions: ['view_competency', 'manage_competency'] },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', color: 'primary', typeAction: 'row', permissions: ['manage_competency'] },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', color: 'danger', typeAction: 'row', permissions: ['manage_competency'] }];
