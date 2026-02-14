import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/home/home'),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/pages/home/home'),
        title: 'Dashboard',
      },
      {
        path: 'academic-setup',
        loadChildren: () => import('@features/academic-setting/academic-setting.routes'),
        title: 'Configuración Académica',
      },
      {
        path: 'organization',
        loadChildren: () => import('@features/organization/organization.routes'),
        title: 'Organización Escolar',
      },
      {
        path: 'students',
        loadChildren: () => import('@features/students/students.routes'),
        title: 'Estudiantes',
      },
      {
        path: 'teachers',
        loadChildren: () => import('@features/teachers/teachers.routes'),
        title: 'Docentes',
      },
      {
        path: 'attendance',
        loadChildren: () => import('@features/attendance/attendance.routes'),
        title: 'Asistencia',
      },
      {
        path: 'assessments',
        loadChildren: () => import('@features/assessments/assessments.routes'),
        title: 'Evaluaciones',
      },
      {
        path: 'classroom',
        loadChildren: () => import('@features/classroom/classroom.routes'),
        title: 'Aula Virtual',
      },
      {
        path: 'modules-list',
        loadComponent: () =>
          import('@features/modules-list/pages/modules-list-page/modules-list-page'),
        title: 'Módulos del Sistema',
      },
      {
        path: 'administration',
        loadChildren: () => import('@features/administration/administration.routes'),
        title: 'Administración',
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
] as Routes;
