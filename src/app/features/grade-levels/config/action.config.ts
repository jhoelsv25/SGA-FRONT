import { ActionConfig } from '@core/types/action-types';

export const GRADE_LEVEL_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Nuevo grado', icon: 'fas fa-plus', typeAction: 'header', color: 'success', permissions: ['manage_grade_level'] },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary', permissions: ['view_grade_level', 'manage_grade_level'] },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary', permissions: ['manage_grade_level'] },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger', permissions: ['manage_grade_level'] }];
