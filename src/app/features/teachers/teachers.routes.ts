import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('../teachers/pages/teachers/teachers').then((m) => m.default),
    title: 'Lista de Docentes',
    data: { permissions: ['view_teacher'] },
  },
  {
    path: 'attendances',
    loadComponent: () =>
      import('./pages/teacher-attendances/teacher-attendances').then((m) => m.default),
    title: 'Asistencia Docente',
    data: { permissions: ['view_teacher_attendance', 'manage_teacher_attendance'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/teacher-detail/teacher-detail').then((m) => m.default),
    title: 'Detalle de Docente',
    data: { permissions: ['view_teacher'] },
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
] as Routes;
