import { Routes } from '@angular/router';

export default [
  {
    path: 'sections',
    loadComponent: () => import('../academic-setting/sections/pages/sections/sections'),
    title: 'Secciones',
    data: { permissions: ['view_section', 'manage_section'] },
  },
  {
    path: 'section-courses',
    loadComponent: () => import('../academic-setting/sections/pages/sections/sections'), // TODO: create section-courses component
    title: 'Cursos por Sección',
    data: { permissions: ['view_section_course', 'manage_section_course'] },
  },
  {
    path: 'schedules',
    loadComponent: () => import('../academic-setting/schedules/pages/schedules/schedules'),
    title: 'Horarios',
    data: { permissions: ['view_schedule', 'manage_schedule'] },
  },
  {
    path: '',
    redirectTo: 'sections',
    pathMatch: 'full'
  }
] as Routes;
