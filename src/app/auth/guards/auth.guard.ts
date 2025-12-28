import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { AuthInitializer } from '@auth/services/auth-initializer';

export const authGuard: CanActivateFn = async (route, state) => {
  const authFacade = inject(AuthFacade);
  const authInitializer = inject(AuthInitializer);
  const router = inject(Router);

  console.log('🔒 [AuthGuard] Verificando acceso a ruta protegida:', state.url);

  // ⏳ Esperar a que la inicialización termine
  await authInitializer.initialize();

  // Verificar autenticación
  const isAuthenticated = authFacade.isAuthenticated();

  if (!isAuthenticated) {
    console.log('❌ [AuthGuard] Usuario NO autenticado, redirigiendo a login');
    return router.createUrlTree(['/auth/login'], {
      queryParams: { redirect: state.url },
    });
  }

  // Verificar si el usuario tiene módulos/permisos
  const modules = authFacade.getModules();
  if (!modules || modules.length === 0) {
    console.log('❌ [AuthGuard] Usuario sin permisos');
    return router.createUrlTree(['/no-permissions']);
  }

  console.log('✅ [AuthGuard] Acceso permitido');
  return true;
};
