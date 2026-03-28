import { Routes } from '@angular/router';

export default [
  {
    path: 'academic',
    loadComponent: () => import('./pages/reports/reports'),
    title: 'Reportes Académicos',
    data: { permissions: ['report:view'] },
  },
  {
    path: 'attendance',
    loadComponent: () => import('./pages/reports/reports'), // Placeholder
    title: 'Reportes de Asistencia',
    data: { permissions: ['report:view'] },
  },
  {
    path: 'behavior',
    loadComponent: () => import('./pages/reports/reports'), // Placeholder
    title: 'Reportes de Conducta',
    data: { permissions: ['report:view'] },
  },
  {
    path: 'financial',
    loadComponent: () => import('./pages/reports/reports'), // Placeholder
    title: 'Reportes Financieros',
    data: { permissions: ['report:view'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/report-detail/report-detail'),
    title: 'Detalle de Reporte',
    data: { permissions: ['report:view'] },
  },
  {
    path: '',
    redirectTo: 'academic',
    pathMatch: 'full'
  }
] as Routes;
