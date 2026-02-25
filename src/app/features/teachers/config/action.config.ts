import { ActionConfig } from '@core/types/action-types';

export const TEACHER_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Nuevo docente', icon: 'fas fa-plus', typeAction: 'header', color: 'success' },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary' },
  { key: 'downloadTemplate', label: 'Plantilla Excel', icon: 'fas fa-download', typeAction: 'header', color: 'secondary' },
  { key: 'import', label: 'Importar', icon: 'fas fa-file-import', typeAction: 'header', color: 'primary' },
  { key: 'export', label: 'Exportar', icon: 'fas fa-file-export', typeAction: 'header', color: 'primary' },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary' },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger' },
];
