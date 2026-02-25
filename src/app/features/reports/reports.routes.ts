import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/reports/reports'),
    title: 'Reportes',
    data: { permissions: ['view_report', 'manage_report'] },
  },
] as Routes;
