import { Routes } from '@angular/router';

export default [
  {
    path: 'institution',
    loadComponent: () => import('../academic-setting/institution/pages/institution/institution'),
    title: 'Institución Educativa',
    data: { permissions: ['manage_institution'] },
  },
  {
    path: 'users',
    loadComponent: () => import('../users/pages/users/users'), // Need to check users component path
    title: 'Usuarios',
    data: { permissions: ['view_user', 'manage_user'] },
  },
  {
    path: 'roles',
    loadComponent: () => import('../users/roles/pages/roles/roles'), // Placeholder path
    title: 'Roles',
    data: { permissions: ['view_role', 'manage_role'] },
  },
  {
    path: 'permissions',
    loadComponent: () => import('../users/permissions/pages/permissions/permissions'), // Placeholder path
    title: 'Permisos',
    data: { permissions: ['view_permission', 'manage_permission'] },
  },
  {
    path: 'sessions',
    loadComponent: () => import('../users/sessions/pages/sessions/sessions'), // Placeholder path
    title: 'Sesiones Activas',
    data: { permissions: ['view_sessions', 'manage_sessions'] },
  },
  {
    path: 'audit-logs',
    loadComponent: () => import('../users/audit-logs/pages/audit-logs/audit-logs'), // Placeholder path
    title: 'Auditoría',
    data: { permissions: ['view_audit_log'] },
  },
  {
    path: '',
    redirectTo: 'institution',
    pathMatch: 'full'
  }
] as Routes;
