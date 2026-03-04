import { Routes } from '@angular/router';

export default [
  {
    path: 'announcements',
    loadComponent: () => import('./pages/communications/communications'),
    title: 'Anuncios',
    data: { permissions: ['view_announcement', 'manage_announcement'] },
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/communications/communications'), // Placeholder
    title: 'Notificaciones',
    data: { permissions: ['view_notification'] },
  },
  {
    path: 'email-logs',
    loadComponent: () => import('./pages/communications/communications'), // Placeholder
    title: 'Historial de Emails',
    data: { permissions: ['view_email_log'] },
  },
  {
    path: '',
    redirectTo: 'announcements',
    pathMatch: 'full'
  }
] as Routes;
