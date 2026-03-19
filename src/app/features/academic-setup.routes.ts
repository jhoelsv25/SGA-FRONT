import { Routes } from '@angular/router';

export default [
  {
    path: 'years',
    loadComponent: () => import('@features/year-academic/pages/year-academic/year-academic'),
    title: 'Años Académicos',
    data: { permissions: ['view_academic_year', 'manage_academic_year'] },
  },
  {
    path: 'years/:id',
    loadComponent: () => import('@features/year-academic/pages/year-academic-detail/year-academic-detail'),
    title: 'Detalle del año académico',
    data: { permissions: ['view_academic_year', 'manage_academic_year'] },
  },
  {
    path: 'grade-levels',
    loadComponent: () => import('@features/grade-levels/pages/grade-levels/grade-levels'),
    title: 'Niveles de grado',
    data: { permissions: ['view_grade_level', 'manage_grade_level'] },
  },
  {
    path: 'subject-areas',
    loadComponent: () => import('@features/subject-areas/pages/subject-areas/subject-areas'),
    title: 'Áreas Curriculares',
    data: { permissions: ['view_subject_area', 'manage_subject_area'] },
  },
  {
    path: 'courses',
    loadComponent: () => import('@features/courses/pages/courses/courses'),
    title: 'Cursos',
    data: { permissions: ['view_course', 'manage_course'] },
  },
  {
    path: 'competencies',
    loadComponent: () => import('@features/competencies/pages/competencies/competencies'),
    title: 'Competencias',
    data: { permissions: ['view_competency', 'manage_competency'] },
  },
  {
    path: '',
    redirectTo: 'years',
    pathMatch: 'full',
  }] as Routes;
