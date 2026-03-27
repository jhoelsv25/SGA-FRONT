import { Routes } from '@angular/router';

export default [
  {
    path: 'register',
    loadComponent: () => import('./pages/attendance-register/attendance-register'),
    title: 'Registro de Asistencias',
    data: { permissions: ['manage_attendance'] },
  },
  {
    path: 'quick-register',
    loadComponent: () => import('./pages/attendance-quick-register/attendance-quick-register'),
    title: 'Registro rápido de asistencia',
    data: { permissions: ['manage_attendance'] },
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/attendance-reports/attendance-reports'),
    title: 'Reportes de Asistencia',
    data: { permissions: ['view_attendance'] },
  },
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  }
] as Routes;
