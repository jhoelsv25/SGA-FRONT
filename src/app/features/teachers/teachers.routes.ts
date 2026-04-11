import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('../teachers/pages/teachers/teachers').then((m) => m.default),
    title: 'Lista de Docentes',
    data: { permissions: ['teacher:view'] },
  },
  {
    path: 'attendances',
    loadComponent: () =>
      import('./pages/teacher-attendances/teacher-attendances').then((m) => m.default),
    title: 'Seguimiento Docente',
    data: { permissions: ['teacher_attendance:view'] },
  },
  {
    path: 'daily-monitoring',
    loadComponent: () =>
      import('./pages/teacher-daily-monitoring/teacher-daily-monitoring').then((m) => m.default),
    title: 'Asistencia Docente',
    data: { permissions: ['teacher_attendance:view'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/teacher-detail/teacher-detail').then((m) => m.default),
    title: 'Detalle de Docente',
    data: { permissions: ['teacher:view'] },
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
] as Routes;
