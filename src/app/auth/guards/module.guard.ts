import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { AuthInitializer } from '@auth/services/auth-initializer';

export const moduleGuard: CanActivateFn = async (route): Promise<boolean | UrlTree> => {
  const authFacade = inject(AuthFacade);
  const authInitializer = inject(AuthInitializer);
  const router = inject(Router);

  // ⏳ Esperar a que la inicialización termine
  await authInitializer.initialize();

  if (!authFacade.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const requiredPermission = route.data?.['permission'];

  if (!requiredPermission) {
    return true;
  }

  const hasAccess = authFacade.hasPermission(requiredPermission);
  return hasAccess ? true : router.createUrlTree(['/access-denied']);
};
