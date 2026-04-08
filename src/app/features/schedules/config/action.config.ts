import { ActionConfig } from '@core/types/action-types';

export const SCHEDULE_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Nuevo horario', icon: 'fas fa-plus', typeAction: 'header', color: 'success' },
  { key: 'admin', label: 'Administrar horario', icon: 'fas fa-cogs', typeAction: 'header', color: 'primary' },
  { key: 'print', label: 'Imprimir horario', icon: 'fas fa-print', typeAction: 'header', color: 'primary' },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary' },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger' }];
