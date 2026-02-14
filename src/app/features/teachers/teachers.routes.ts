import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('../teachers/pages/teachers/teachers'),
    title: 'Lista de Docentes',
    data: { permissions: ['view_teacher'] },
  },
  {
    path: 'attendances',
    loadComponent: () => import('../teachers/pages/teachers/teachers'), // Placeholder
    title: 'Asistencia Docente',
    data: { permissions: ['view_teacher_attendance', 'manage_teacher_attendance'] },
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
] as Routes;
