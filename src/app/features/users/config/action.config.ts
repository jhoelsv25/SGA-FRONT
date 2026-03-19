import { ActionConfig } from '@core/types/action-types';

export const USER_ACTIONS: ActionConfig[] = [
  {
    key: 'create',
    label: 'Nuevo usuario',
    icon: 'fas fa-plus',
    typeAction: 'header',
    color: 'success',
  },
  {
    key: 'export',
    label: 'Exportar a Excel',
    icon: 'fas fa-file-excel',
    typeAction: 'header',
    color: 'success',
  },
  {
    key: 'import',
    label: 'Importar',
    icon: 'fas fa-file-import',
    typeAction: 'header',
    color: 'primary',
  },
  {
    key: 'refresh',
    label: 'Actualizar',
    icon: 'fas fa-sync-alt',
    typeAction: 'header',
    color: 'primary',
  },
  {
    key: 'sessions-global',
    label: 'Sesiones',
    icon: 'fas fa-history',
    typeAction: 'header',
    color: 'secondary',
  },
  { key: 'toggle-active', label: 'Activar / Desactivar', icon: 'fas fa-power-off', typeAction: 'row', color: 'warning' },
  { key: 'sessions', label: 'Sesiones', icon: 'fas fa-history', typeAction: 'row', color: 'secondary' },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary' },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger' },
];
