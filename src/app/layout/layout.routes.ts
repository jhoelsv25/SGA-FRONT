import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/home/home'),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/pages/home/home'),
      },
      {
        path: 'academic-setup',
        loadChildren: () => import('@features/academic-setting/academic-setting.routes'),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
] as Routes;
