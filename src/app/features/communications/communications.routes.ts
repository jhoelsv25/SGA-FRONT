import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/communications/communications'),
    title: 'Comunicaciones',
    data: { permissions: ['view_communication', 'manage_communication'] },
  },
] as Routes;
