import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('../students/pages/students/students'),
    title: 'Lista de Estudiantes',
    data: { permissions: ['view_student'] },
  },
  {
    path: 'enrollments',
    loadComponent: () => import('../academic-setting/enrollments/pages/enrollments/enrollments'),
    title: 'Matrículas',
    data: { permissions: ['view_enrollment', 'manage_enrollment'] },
  },
  {
    path: 'guardians',
    loadComponent: () => import('../students/pages/students/students'), // Placeholder
    title: 'Apoderados',
    data: { permissions: ['view_guardian', 'manage_guardian'] },
  },
  {
    path: 'observations',
    loadComponent: () => import('../students/pages/students/students'), // Placeholder
    title: 'Observaciones',
    data: { permissions: ['view_observation', 'manage_observation'] },
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
] as Routes;
