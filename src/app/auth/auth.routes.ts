


import { Routes } from '@angular/router';
import { publicGuard } from '@auth/guards/public.guard';

const route: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home'),
    children: [
      {
        title: 'Iniciar sesión',
        path: 'login',
        loadComponent: () => import('./pages/login/login'),
        canActivate: [publicGuard],
        data: { authPage: true }, // Marca esta página como página de autenticación
      },
      {
        title: 'Recuperar contraseña',
        path: 'forgot-password',
        loadComponent: () => import('./pages/forgot-password/forgot-password'),
        canActivate: [publicGuard],
        data: { authPage: true }, // Marca esta página como página de autenticación
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
];

export default route;
