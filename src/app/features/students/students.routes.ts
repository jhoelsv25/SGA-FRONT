import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('./pages/students/students').then((m) => m.default),
    title: 'Lista de Estudiantes',
    data: { permissions: ['view_student'] },
  },
  {
    path: 'enrollments',
    loadComponent: () => import('../enrollments/pages/enrollments/enrollments').then((m) => m.default),
    title: 'Matrículas',
    data: { permissions: ['view_enrollment', 'manage_enrollment'] },
  },
  {
    path: 'guardians',
    loadComponent: () => import('./pages/guardians/guardians').then((m) => m.default),
    title: 'Apoderados',
    data: { permissions: ['view_guardian', 'manage_guardian'] },
  },
  {
    path: 'observations',
    loadComponent: () => import('./pages/observations/observations').then((m) => m.default),
    title: 'Observaciones',
    data: { permissions: ['view_observation', 'manage_observation'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/student-detail/student-detail').then((m) => m.default),
    title: 'Detalle de Estudiante',
    data: { permissions: ['view_student'] },
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  }] as Routes;
