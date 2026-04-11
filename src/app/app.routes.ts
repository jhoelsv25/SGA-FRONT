import { Routes } from '@angular/router';
import { authGuard } from '@auth/guards/auth.guard';
import { publicGuard } from '@auth/guards/public.guard';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [
      () => {
        const authFacade = inject(AuthFacade);
        const router = inject(Router);

        if (authFacade.isAuthenticated()) {
          const modules = authFacade.getModules();
          if (!modules || modules.length === 0) {
            return router.createUrlTree(['/no-permissions']);
          }
          return router.createUrlTree(['/dashboard']);
        }
        return router.createUrlTree(['/auth/login']);
      },
    ],
    children: [],
  },

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
    canActivate: [publicGuard],
  },

  {
    path: 'no-permissions',
    loadComponent: () =>
      import('./shared/pages/no-permissions/no-permissions').then((m) => m.NoPermissions),
  },

  {
    path: 'access-denied',
    loadComponent: () => import('./shared/pages/access-denied/access-denied'),
  },

  {
    path: 'not-found',
    loadComponent: () => import('./shared/pages/not-found/not-found'),
  },

  {
    path: '',
    loadChildren: () => import('./layout/layout.routes'),
    canActivate: [authGuard],
  },

  {
    path: '**',
    canActivate: [
      () => {
        const authFacade = inject(AuthFacade);
        const router = inject(Router);

        if (authFacade.isAuthenticated()) {
          const modules = authFacade.getModules();
          if (!modules || modules.length === 0) {
            return router.createUrlTree(['/no-permissions']);
          }
          return router.createUrlTree(['/dashboard']);
        }
        return router.createUrlTree(['/auth/login']);
      },
    ],
    children: [],
  },
];
