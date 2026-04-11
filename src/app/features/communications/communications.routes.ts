import { Routes } from '@angular/router';

export default [
  {
    path: 'announcements',
    loadComponent: () => import('./pages/communications/communications'),
    title: 'Anuncios',
    data: { permissions: ['announcement:view'] },
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/communications/communications'), // Placeholder
    title: 'Notificaciones',
    data: { permissions: ['notification:view'] },
  },
  {
    path: 'email-logs',
    loadComponent: () => import('./pages/communications/communications'), // Placeholder
    title: 'Historial de Emails',
    data: { permissions: ['email_log:view'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/communication-detail/communication-detail'),
    title: 'Detalle de Comunicación',
    data: { permissions: ['announcement:view', 'notification:view'] },
  },
  {
    path: '',
    redirectTo: 'announcements',
    pathMatch: 'full',
  },
] as Routes;
