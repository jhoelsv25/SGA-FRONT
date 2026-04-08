import { ZardToastComponent } from '@/shared/components/toast';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthInitializer } from '@auth/services/auth-initializer';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { NotificationPermissionCardComponent } from '@core/components/notification-permission-card/notification-permission-card';
import { RealtimeNotificationStackComponent } from '@core/components/realtime-notification-stack/realtime-notification-stack';


@Component({
  selector: 'sga-root',
  imports: [
    RouterOutlet,
    ZardToastComponent,
    NotificationPermissionCardComponent,
    RealtimeNotificationStackComponent,
  ],
  template: ` <z-toast />
    <router-outlet />
    <sga-realtime-notification-stack />
    <sga-notification-permission-card />`,
})
export class App {
  protected readonly title = signal('SGA-FRONT');
  private authInitializer = inject(AuthInitializer);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  constructor() {
    this.authInitializer.initialize().then((isAuthenticated) => {
      console.log('✅ [App] Auth initialized:', isAuthenticated);
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
