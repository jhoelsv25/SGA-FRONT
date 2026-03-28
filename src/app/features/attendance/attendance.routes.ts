import { Routes } from '@angular/router';

export default [
  {
    path: 'register',
    loadComponent: () => import('./pages/attendance-register/attendance-register'),
    title: 'Registro de Asistencias',
    data: { permissions: ['attendance:register'] },
  },
  {
    path: 'quick-register',
    loadComponent: () => import('./pages/attendance-quick-register/attendance-quick-register'),
    title: 'Registro rápido de asistencia',
    data: { permissions: ['attendance:quick-register'] },
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/attendance-reports/attendance-reports'),
    title: 'Reportes de Asistencia',
    data: { permissions: ['attendance:view'] },
  },
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  }
] as Routes;
