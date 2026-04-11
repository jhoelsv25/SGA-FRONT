import { Routes } from '@angular/router';

export default [
  {
    path: 'years',
    loadComponent: () => import('@features/year-academic/pages/year-academic/year-academic'),
    title: 'Años Académicos',
    data: { permissions: ['academic_year:view'] },
  },
  {
    path: 'years/:id',
    loadComponent: () =>
      import('@features/year-academic/pages/year-academic-detail/year-academic-detail'),
    title: 'Detalle del año académico',
    data: { permissions: ['academic_year:view'] },
  },
  {
    path: 'grade-levels',
    loadComponent: () => import('@features/grade-levels/pages/grade-levels/grade-levels'),
    title: 'Niveles de grado',
    data: { permissions: ['grade_level:view'] },
  },
  {
    path: 'subject-areas',
    loadComponent: () => import('@features/subject-areas/pages/subject-areas/subject-areas'),
    title: 'Áreas Curriculares',
    data: { permissions: ['subject_area:view'] },
  },
  {
    path: 'courses',
    loadComponent: () => import('@features/courses/pages/courses/courses'),
    title: 'Cursos',
    data: { permissions: ['course:view'] },
  },
  {
    path: 'competencies',
    loadComponent: () => import('@features/competencies/pages/competencies/competencies'),
    title: 'Competencias',
    data: { permissions: ['competency:view'] },
  },
  {
    path: '',
    redirectTo: 'years',
    pathMatch: 'full',
  },
] as Routes;
