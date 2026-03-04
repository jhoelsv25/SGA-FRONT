import { Routes } from '@angular/router';

export default [
  {
    path: 'academic',
    loadComponent: () => import('./pages/reports/reports'),
    title: 'Reportes Académicos',
    data: { permissions: ['view_report'] },
  },
  {
    path: 'attendance',
    loadComponent: () => import('./pages/reports/reports'), // Placeholder
    title: 'Reportes de Asistencia',
    data: { permissions: ['view_report'] },
  },
  {
    path: 'behavior',
    loadComponent: () => import('./pages/reports/reports'), // Placeholder
    title: 'Reportes de Conducta',
    data: { permissions: ['view_report'] },
  },
  {
    path: 'financial',
    loadComponent: () => import('./pages/reports/reports'), // Placeholder
    title: 'Reportes Financieros',
    data: { permissions: ['view_report'] },
  },
  {
    path: '',
    redirectTo: 'academic',
    pathMatch: 'full'
  }
] as Routes;
