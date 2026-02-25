import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/payments/payments'),
    title: 'Pagos',
    data: { permissions: ['view_payment', 'manage_payment'] },
  },
] as Routes;
