import { Routes } from '@angular/router';

export default [
  {
    path: 'register',
    loadComponent: () => import('./pages/payments/payments'),
    title: 'Registro de Pagos',
    data: { permissions: ['manage_payment'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/payment-detail/payment-detail'),
    title: 'Detalle de Pago',
    data: { permissions: ['view_payment', 'manage_payment'] },
  },
  {
    path: 'pending',
    loadComponent: () => import('./pages/payments/payments'), // Placeholder
    title: 'Pendientes',
    data: { permissions: ['view_payment'] },
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/payments/payments'), // Placeholder
    title: 'Historial',
    data: { permissions: ['view_payment'] },
  },
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  }
] as Routes;
