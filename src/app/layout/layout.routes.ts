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
        loadChildren: () => import('@features/academic-setup.routes'),
        title: 'Configuración Académica',
      },
      {
        path: 'organization',
        loadChildren: () => import('@features/organization.routes'),
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
        path: 'access-control',
        loadChildren: () => import('@features/access-control/access-control.routes'),
        title: 'Control de Accesos',
      },
      {
        path: 'general-attendance',
        redirectTo: 'access-control',
        pathMatch: 'full',
      },
      {
        path: 'assessments',
        loadChildren: () => import('@features/assessments/assessments.routes'),
        title: 'Evaluaciones',
      },
      {
        path: 'virtual-classroom',
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
        loadChildren: () => import('@features/administration.routes'),
        title: 'Administración',
      },
      {
        path: 'behavior',
        loadChildren: () => import('@features/behavior/behavior.routes'),
        title: 'Conducta e incidencias',
      },
      {
        path: 'communications',
        loadChildren: () => import('@features/communications/communications.routes'),
        title: 'Comunicaciones',
      },
      {
        path: 'payments',
        loadChildren: () => import('@features/payments/payments.routes'),
        title: 'Pagos',
      },
      {
        path: 'reports',
        loadChildren: () => import('@features/reports/reports.routes'),
        title: 'Reportes',
      },
      {
        path: 'account/profile',
        loadComponent: () =>
          import('../features/account/pages/profile/profile').then((m) => m.default),
        title: 'Mi Perfil',
      },
      {
        path: 'account/settings',
        loadComponent: () =>
          import('../features/account/pages/settings/settings').then((m) => m.default),
        title: 'Configuración',
      },
      {
        path: 'account/change-password',
        loadComponent: () =>
          import('../features/account/pages/change-password/change-password').then(
            (m) => m.default,
          ),
        title: 'Cambiar contraseña',
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
] as Routes;
