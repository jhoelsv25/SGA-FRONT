import { Routes } from '@angular/router';

export default [
  {
    path: 'years',
    loadComponent: () => import('../academic-setup/year-academic/pages/year-academic/year-academic'),
    title: 'Años Académicos',
    data: { permissions: ['view_academic_year', 'manage_academic_year'] },
  },
  {
    path: 'years/:id',
    loadComponent: () => import('../academic-setup/year-academic/pages/year-academic-detail/year-academic-detail'),
    title: 'Detalle del año académico',
    data: { permissions: ['view_academic_year', 'manage_academic_year'] },
  },
  {
    path: 'periods',
    loadComponent: () => import('../academic-setup/periods/pages/periods/periods'),
    title: 'Períodos Académicos',
    data: { permissions: ['view_academic_period', 'manage_academic_period'] },
  },
  {
    path: 'grade-levels',
    loadComponent: () => import('../academic-setup/grade-levels/pages/grade-levels/grade-levels'),
    title: 'Niveles de grado',
    data: { permissions: ['view_grade_level', 'manage_grade_level'] },
  },
  {
    path: 'subject-areas',
    loadComponent: () => import('../academic-setup/subject-areas/pages/subject-areas/subject-areas'),
    title: 'Áreas Curriculares',
    data: { permissions: ['view_subject_area', 'manage_subject_area'] },
  },
  {
    path: 'courses',
    loadComponent: () => import('../academic-setup/courses/pages/courses/courses'),
    title: 'Cursos',
    data: { permissions: ['view_course', 'manage_course'] },
  },
  {
    path: 'competencies',
    loadComponent: () => import('../academic-setup/competencies/pages/competencies/competencies'),
    title: 'Competencias',
    data: { permissions: ['view_competency', 'manage_competency'] },
  },
  {
    path: '',
    redirectTo: 'years',
    pathMatch: 'full'
  }
] as Routes;
