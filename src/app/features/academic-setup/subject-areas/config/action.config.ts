import { ActionConfig } from '@core/types/action-types';

export const SUBJECT_AREAS_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Crear área', icon: 'fas fa-plus', color: 'success', typeAction: 'header', permissions: ['manage_subject_area'] },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', color: 'primary', typeAction: 'header', permissions: ['view_subject_area', 'manage_subject_area'] },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', color: 'primary', typeAction: 'row', permissions: ['manage_subject_area'] },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', color: 'danger', typeAction: 'row', permissions: ['manage_subject_area'] }];
