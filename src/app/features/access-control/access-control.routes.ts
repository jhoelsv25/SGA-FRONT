import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/access-control-page/access-control-page'),
    title: 'Control de Accesos',
  },
] as Routes;
