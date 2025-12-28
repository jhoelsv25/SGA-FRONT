import { Routes } from '@angular/router';

export default [
  {
    path: 'years',
    loadComponent: () => import('./year-academic/pages/year-academic/year-academic'),
    title: 'Años Académicos',
    data: { permissions: ['view_academic_year', 'manage_academic_year'] },
  },

  {
    path: 'subject-areas',
    loadComponent: () => import('./subject-areas/pages/subject-areas/subject-areas'),
    title: 'Áreas Curriculares',
    data: { permissions: ['view_subject_area', 'manage_subject_area'] },
  },
  {
    path: 'courses',
    loadComponent: () => import('./courses/pages/courses/courses'),
    title: 'Cursos',
    data: { permissions: ['view_course', 'manage_course'] },
  },
  {
    path: 'competencies',
    loadComponent: () => import('./competencies/pages/competencies/competencies'),
    title: 'Competencias',
    data: { permissions: ['view_competency', 'manage_competency'] },
  },
] as Routes;
