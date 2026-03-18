import { Routes } from '@angular/router';

export default [
  {
    path: 'institution',
    loadComponent: () => import('./institution/pages/institution/institution'),
    title: 'Institución Educativa',
    data: { permissions: ['manage_institution'] },
  },
  {
    path: 'users',
    loadComponent: () => import('./users/pages/users'),
    title: 'Usuarios',
    data: { permissions: ['view_user', 'manage_user'] },
  },
  {
    path: 'users/import',
    loadComponent: () => import('./users/pages/user-import'),
    title: 'Importar Usuarios',
    data: { permissions: ['manage_user'] },
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/pages/roles/roles'),
    title: 'Roles',
    data: { permissions: ['view_role', 'manage_role'] },
  },
  {
    path: 'roles/:id',
    loadComponent: () => import('./roles/pages/role-permissions/role-permissions'),
    title: 'Permisos de Rol',
    data: { permissions: ['manage_role'] },
  },
  {
    path: 'permissions',
    loadComponent: () => import('./permissions/pages/permissions/permissions'),
    title: 'Permisos',
    data: { permissions: ['view_permission', 'manage_permission'] },
  },
  {
    path: 'sessions',
    loadComponent: () => import('./sessions/pages/sessions/sessions'),
    title: 'Sesiones Activas',
    data: { permissions: ['view_sessions', 'manage_sessions'] },
  },
  {
    path: 'audit-logs',
    loadComponent: () => import('./audit-logs/pages/audit-logs'),
    title: 'Auditoría',
    data: { permissions: ['view_audit_log'] },
  },
  {
    path: '',
    redirectTo: 'institution',
    pathMatch: 'full',
  },
] as Routes;
