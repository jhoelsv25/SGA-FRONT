import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/behaviors/behaviors'),
    title: 'Conducta e incidencias',
    data: { permissions: ['view_behavior', 'manage_behavior'] },
  },
] as Routes;
