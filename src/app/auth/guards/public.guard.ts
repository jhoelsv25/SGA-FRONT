import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { AuthInitializer } from '@auth/services/auth-initializer';

export const publicGuard: CanActivateFn = async (route, state) => {
  const authFacade = inject(AuthFacade);
  const authInitializer = inject(AuthInitializer);
  const router = inject(Router);

  console.log('🔒 [PublicGuard] Verificando acceso a ruta pública:', state.url);

  // ⏳ Esperar a que la inicialización termine
  await authInitializer.initialize();

  // Verificar autenticación
  const isAuthenticated = authFacade.isAuthenticated();

  // Si NO está autenticado, permitir acceso a rutas públicas
  if (!isAuthenticated) {
    console.log('✅ [PublicGuard] Usuario NO autenticado, permitir acceso');
    return true;
  }

  // Si YA está autenticado, verificar permisos antes de redirigir
  console.log('🔄 [PublicGuard] Usuario autenticado, redirigiendo...');
  const returnUrl = route.queryParams?.['returnUrl'];
  const modules = authFacade.getModules();

  // Si no tiene módulos/permisos, redirigir a no-permissions
  if (!modules || modules.length === 0) {
    return router.createUrlTree(['/no-permissions']);
  }

  // Si tiene permisos, redirigir según corresponda
  const redirectTo = route.queryParams?.['redirect'] || route.queryParams?.['returnUrl'];

  if (redirectTo && redirectTo !== '/auth/login') {
    return router.parseUrl(redirectTo);
  }

  return router.createUrlTree(['/dashboard']);
};
