import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('../assessment-management/pages/assessments/assessments'),
    title: 'Evaluaciones',
    data: { permissions: ['view_assessment', 'manage_assessment'] },
  },
  {
    path: 'scores',
    loadComponent: () => import('../assessment-management/pages/scores/scores'),
    title: 'Registro de Calificaciones',
    data: { permissions: ['manage_assessment_score'] },
  },
  {
    path: 'grades',
    loadComponent: () => import('../assessment-management/pages/grades/grades'),
    title: 'Notas Finales',
    data: { permissions: ['view_grade', 'manage_grade'] },
  },
  {
    path: ':id',
    loadComponent: () => import('../assessment-management/pages/assessment-detail/assessment-detail'),
    title: 'Detalle de Evaluación',
    data: { permissions: ['view_assessment', 'manage_assessment'] },
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
] as Routes;
