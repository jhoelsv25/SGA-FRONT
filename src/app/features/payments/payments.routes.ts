import { Routes } from '@angular/router';

export default [
  {
    path: 'register',
    loadComponent: () => import('./pages/payments/payments'),
    title: 'Registro de Pagos',
    data: { permissions: ['payment:view'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/payment-detail/payment-detail'),
    title: 'Detalle de Pago',
    data: { permissions: ['payment:view'] },
  },
  {
    path: 'pending',
    loadComponent: () => import('./pages/payments/payments'), // Placeholder
    title: 'Pendientes',
    data: { permissions: ['payment:view'] },
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/payments/payments'), // Placeholder
    title: 'Historial',
    data: { permissions: ['payment:view'] },
  },
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  }
] as Routes;
