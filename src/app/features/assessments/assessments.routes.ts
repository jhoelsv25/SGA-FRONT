import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('../assessment-management/pages/assessments/assessments'),
    title: 'Evaluaciones',
    data: { permissions: ['assessment:view'] },
  },
  {
    path: 'scores',
    loadComponent: () => import('../assessment-management/pages/scores/scores'),
    title: 'Registro de Calificaciones',
    data: { permissions: ['assessment_score:update'] },
  },
  {
    path: 'grades',
    loadComponent: () => import('../assessment-management/pages/grades/grades'),
    title: 'Notas Finales',
    data: { permissions: ['grade:view'] },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../assessment-management/pages/assessment-detail/assessment-detail'),
    title: 'Detalle de Evaluación',
    data: { permissions: ['assessment:view'] },
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
] as Routes;
