import { ActionConfig } from '@core/types/action-types';

export const YEAR_ACADEMIC_ACTIONS: ActionConfig[] = [
  {
    key: 'create',
    label: 'Agregar',
    icon: 'fas fa-plus',
    typeAction: 'header',
    color: 'success',
    permissions: ['manage_academic_year'],
  },
  {
    key: 'edit',
    label: 'Editar',
    icon: 'fas fa-edit',
    typeAction: 'row',
    color: 'primary',
    permissions: ['manage_academic_year'],
  },
  {
    key: 'delete',
    label: 'Eliminar',
    icon: 'fas fa-trash',
    typeAction: 'row',
    color: 'danger',
    permissions: ['manage_academic_year'],
  }];
