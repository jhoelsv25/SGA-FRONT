import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('./pages/students/students').then((m) => m.default),
    title: 'Lista de Estudiantes',
    data: { permissions: ['student:view'] },
  },
  {
    path: 'enrollments',
    loadComponent: () => import('../enrollments/pages/enrollments/enrollments').then((m) => m.default),
    title: 'Matrículas',
    data: { permissions: ['enrollment:view'] },
  },
  {
    path: 'enrollments/:id',
    loadComponent: () => import('../enrollments/pages/enrollment-detail/enrollment-detail').then((m) => m.default),
    title: 'Detalle de Matrícula',
    data: { permissions: ['enrollment:view'] },
  },
  {
    path: 'guardians',
    loadComponent: () => import('./pages/guardians/guardians').then((m) => m.default),
    title: 'Apoderados',
    data: { permissions: ['guardian:view'] },
  },
  {
    path: 'observations',
    loadComponent: () => import('./pages/observations/observations').then((m) => m.default),
    title: 'Observaciones',
    data: { permissions: ['observation:view'] },
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/student-detail/student-detail').then((m) => m.default),
    title: 'Detalle de Estudiante',
    data: { permissions: ['student:view'] },
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  }] as Routes;
