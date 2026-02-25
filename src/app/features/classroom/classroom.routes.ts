import { Routes } from '@angular/router';

export default [
  {
    path: ':id',
    loadComponent: () => import('./pages/classroom/classroom'),
    children: [
      {
        path: 'timeline',
        loadComponent: () => import('./pages/timeline/timeline'),
      },
      {
        path: 'tasks',
        loadComponent: () => import('./pages/tasks/tasks'),
      },
      {
        path: 'grades',
        loadComponent: () => import('./pages/grades/grades'),
      },
      {
        path: 'chat',
        loadComponent: () => import('./pages/chat/chat'),
      },
      {
        path: 'people',
        loadComponent: () => import('./pages/people/people'),
      },
      {
        path: '',
        redirectTo: 'timeline',
        pathMatch: 'full',
      }
    ]
  }
] as Routes;
