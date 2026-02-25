import { ActionConfig } from '@core/types/action-types';

export const REPORT_ACTIONS: ActionConfig[] = [
  {
    key: 'generate',
    label: 'Generar reporte',
    icon: 'fas fa-file-export',
    typeAction: 'header',
    color: 'success',
  },
  {
    key: 'refresh',
    label: 'Actualizar',
    icon: 'fas fa-sync-alt',
    typeAction: 'header',
    color: 'primary',
  },
  {
    key: 'download',
    label: 'Descargar',
    icon: 'fas fa-download',
    typeAction: 'row',
    color: 'primary',
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'fas fa-trash',
    typeAction: 'row',
    color: 'danger',
  },
];
