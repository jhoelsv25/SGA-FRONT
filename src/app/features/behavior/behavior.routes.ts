import { Routes } from '@angular/router';

export default [
  {
    path: 'records',
    loadComponent: () => import('./pages/behaviors/behaviors'),
    title: 'Registro de Conducta',
    data: { permissions: ['view_behavior', 'manage_behavior'] },
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/behaviors/behaviors'), // Placeholder
    title: 'Reportes',
    data: { permissions: ['view_behavior'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/behavior-detail/behavior-detail'),
    title: 'Detalle de Conducta',
    data: { permissions: ['view_behavior', 'manage_behavior'] },
  },
  {
    path: '',
    redirectTo: 'records',
    pathMatch: 'full'
  }
] as Routes;
