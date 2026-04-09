import { Routes } from '@angular/router';

export default [
  {
    path: 'institution',
    loadComponent: () => import('./institution/pages/institution/institution'),
    title: 'Institución Educativa',
    data: { permissions: ['institution:update'] },
  },
  {
    path: 'institution/config',
    loadComponent: () => import('./institution/pages/institution-config/institution-config'),
    title: 'Configuración Supervisión',
    data: { permissions: ['institution:update'] },
  },
  {
    path: 'users',
    loadComponent: () => import('./users/pages/users'),
    title: 'Usuarios',
    data: { permissions: ['user:view'] },
  },
  {
    path: 'users/import',
    loadComponent: () => import('./users/pages/user-import'),
    title: 'Importar Usuarios',
    data: { permissions: ['user:import'] },
  },
  {
    path: 'users/:id/sessions',
    loadComponent: () => import('./sessions/pages/sessions/sessions'),
    title: 'Sesiones del Usuario',
    data: { permissions: ['sessions:view'] },
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/pages/roles/roles'),
    title: 'Roles',
    data: { permissions: ['role:view'] },
  },
  {
    path: 'roles/:id',
    loadComponent: () => import('./roles/pages/role-permissions/role-permissions'),
    title: 'Permisos de Rol',
    data: { permissions: ['role:update'] },
  },
  {
    path: 'permissions',
    loadComponent: () => import('./permissions/pages/permissions/permissions'),
    title: 'Permisos',
    data: { permissions: ['permission:view'] },
  },
  {
    path: 'sessions',
    loadComponent: () => import('./sessions/pages/sessions/sessions'),
    title: 'Sesiones Activas',
    data: { permissions: ['sessions:view'] },
  },
  {
    path: 'audit-logs',
    loadComponent: () => import('./audit-logs/pages/audit-logs'),
    title: 'Auditoría',
    data: { permissions: ['audit_log:view'] },
  },
  {
    path: '',
    redirectTo: 'institution',
    pathMatch: 'full',
  },
] as Routes;
