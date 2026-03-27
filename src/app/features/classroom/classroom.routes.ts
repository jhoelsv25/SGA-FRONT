import { Routes } from '@angular/router';

export default [
  {
    path: 'list',
    loadComponent: () => import('./pages/classroom-list/classroom-list'),
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  // Rutas literales del menú: deben ir ANTES de :id para no interpretar "materials", "chat", etc. como UUID
  { path: 'materials', redirectTo: 'list', pathMatch: 'full' },
  { path: 'modules', redirectTo: 'list', pathMatch: 'full' },
  { path: 'assignments', redirectTo: 'list', pathMatch: 'full' },
  { path: 'submissions', redirectTo: 'list', pathMatch: 'full' },
  { path: 'forums', redirectTo: 'list', pathMatch: 'full' },
  { path: 'chat', redirectTo: 'list', pathMatch: 'full' },
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
        path: 'tasks/:taskId',
        loadComponent: () => import('./pages/task-detail/task-detail'),
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
