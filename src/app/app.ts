import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Toast } from '@shared/ui/toast/toast';
import { AuthInitializer } from '@auth/services/auth-initializer';
import { AuthFacade } from '@auth/services/store/auth.acede';

@Component({
  selector: 'sga-root',
  imports: [RouterOutlet, Toast],
  template: ` <sga-toast />
    <router-outlet />`,
})
export class App {
  protected readonly title = signal('SGA-FRONT');
  private authInitializer = inject(AuthInitializer);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  constructor() {
    // 🚀 Inicializar autenticación de forma NO bloqueante
    this.authInitializer.initialize().then((isAuthenticated) => {
      console.log('✅ [App] Auth initialized:', isAuthenticated);

      // Si está autenticado y en ruta pública, redirigir
      if (isAuthenticated) {
        const currentUrl = this.router.url;
        const publicRoutes = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];

        if (publicRoutes.some((route) => currentUrl.startsWith(route))) {
          const modules = this.authFacade.getModules();
          if (modules && modules.length > 0) {
            console.log('🔄 [App] Usuario autenticado en ruta pública, redirigiendo...');
            this.router.navigate(['/dashboard']);
          } else {
            console.log('⚠️ [App] Usuario autenticado sin permisos');
            this.router.navigate(['/no-permissions']);
          }
        }
      }
    });
  }
}
