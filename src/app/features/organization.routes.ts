import { Routes } from '@angular/router';

export default [
  {
    path: 'sections',
    loadComponent: () => import('./sections/pages/sections/sections'),
    title: 'Secciones',
    data: { permissions: ['section:view'] },
  },
  {
    path: 'section-courses',
    loadComponent: () => import('./section-courses/pages/section-courses/section-courses'),
    title: 'Cursos por Sección',
    data: { permissions: ['section_course:view'] },
  },
  {
    path: 'schedules',
    loadComponent: () => import('./schedules/pages/schedules/schedules'),
    title: 'Horarios',
    data: { permissions: ['schedule:view'] },
  },
  {
    path: '',
    redirectTo: 'sections',
    pathMatch: 'full',
  },
] as Routes;
