import { ActionConfig } from '@core/types/action-types';

export const TEACHER_ACTIONS: ActionConfig[] = [
  { key: 'create', label: 'Nuevo docente', icon: 'fas fa-plus', typeAction: 'header', color: 'success', permissions: ['teacher:create'] },
  { key: 'refresh', label: 'Actualizar', icon: 'fas fa-sync-alt', typeAction: 'header', color: 'primary' },
  { key: 'attendances', label: 'Asistencias', icon: 'fas fa-user-check', typeAction: 'header', color: 'primary', permissions: ['teacher-attendance:view'] },
  { key: 'downloadTemplate', label: 'Plantilla Excel', icon: 'fas fa-download', typeAction: 'header', color: 'secondary', permissions: ['teacher:import'] },
  { key: 'import', label: 'Importar', icon: 'fas fa-file-import', typeAction: 'header', color: 'primary', permissions: ['teacher:import'] },
  { key: 'export', label: 'Exportar', icon: 'fas fa-file-export', typeAction: 'header', color: 'primary', permissions: ['teacher:export'] },
  { key: 'edit', label: 'Editar', icon: 'fas fa-edit', typeAction: 'row', color: 'primary', permissions: ['teacher:update'] },
  { key: 'delete', label: 'Eliminar', icon: 'fas fa-trash', typeAction: 'row', color: 'danger', permissions: ['teacher:delete'] }];
