import { Routes } from '@angular/router';

export default [
  {
    path: 'register',
    loadComponent: () => import('../academic-setting/attendances/pages/attendances/attendances'),
    title: 'Registro de Asistencias',
    data: { permissions: ['manage_attendance'] },
  },
  {
    path: 'reports',
    loadComponent: () => import('../academic-setting/attendances/pages/attendances/attendances'), // Placeholder
    title: 'Reportes de Asistencia',
    data: { permissions: ['view_attendance'] },
  },
  {
    path: '',
    redirectTo: 'register',
    pathMatch: 'full'
  }
] as Routes;
