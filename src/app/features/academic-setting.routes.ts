import { Routes } from '@angular/router';

export default [
  {
    path: 'years',
    loadComponent: () => import('./year-academic/pages/year-academic/year-academic'),
    title: 'Años Académicos',
    data: { permissions: ['academic_year:view'] },
  },
  {
    path: 'years/:id',
    loadComponent: () => import('./year-academic/pages/year-academic-detail/year-academic-detail'),
    title: 'Detalle del año académico',
    data: { permissions: ['academic_year:view'] },
  },
  {
    path: 'periods',
    loadComponent: () => import('./periods/pages/periods/periods'),
    title: 'Períodos Académicos',
    data: { permissions: ['academic_period:view'] },
  },
  {
    path: 'grade-levels',
    loadComponent: () => import('./grade-levels/pages/grade-levels/grade-levels'),
    title: 'Niveles de grado',
    data: { permissions: ['grade_level:view'] },
  },
  {
    path: 'subject-areas',
    loadComponent: () => import('./subject-areas/pages/subject-areas/subject-areas'),
    title: 'Áreas Curriculares',
    data: { permissions: ['subject_area:view'] },
  },
  {
    path: 'courses',
    loadComponent: () => import('./courses/pages/courses/courses'),
    title: 'Cursos',
    data: { permissions: ['course:view'] },
  },
  {
    path: 'competencies',
    loadComponent: () => import('./competencies/pages/competencies/competencies'),
    title: 'Competencias',
    data: { permissions: ['competency:view'] },
  },
  {
    path: '',
    redirectTo: 'years',
    pathMatch: 'full'
  }
] as Routes;
