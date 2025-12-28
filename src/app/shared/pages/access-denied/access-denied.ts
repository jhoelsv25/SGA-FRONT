import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@auth/services/store/auth.acede';

@Component({
  selector: 'sga-access-denied',
  imports: [],
  templateUrl: './access-denied.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AccessDenied {
  private router = inject(Router);
  private authFacade = inject(AuthFacade);

  goBack() {
    // Si hay historial, volvemos atrás
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Si no hay historial, intentamos ir a una ruta segura
      this.tryNavigateToSafeRoute();
    }
  }

  goHome() {
    this.tryNavigateToSafeRoute();
  }

  validateSession() {
    this.authFacade.initialize().subscribe({
      next: (isValid) => {
        if (isValid) {
          // Si la sesión es válida, intentamos encontrar una ruta segura
          this.tryNavigateToSafeRoute();
        } else {
          // Si la sesión no es válida, redirigimos al login
          this.router.navigate(['/auth/login']);
        }
      },
      error: () => {
        // En caso de error, lo más seguro es ir al login
        this.router.navigate(['/auth/login']);
      },
    });
  }

  private tryNavigateToSafeRoute() {
    // Verificar si el usuario tiene acceso al dashboard u otras rutas
    const modules = this.authFacade.getModules();

    if (!modules || modules.length === 0) {
      // Si no hay módulos, ir al login
      this.router.navigate(['/auth/login']);
      return;
    }

    // Intentar encontrar el primer módulo al que el usuario tenga acceso
    const firstAccessibleModule = modules.find(
      (module) => module.permissions && module.permissions.length > 0,
    );

    if (firstAccessibleModule) {
      // Navegar al primer módulo accesible
      this.router.navigate([firstAccessibleModule.path]);
    } else {
      // Si no encontramos ningún módulo accesible, ir al login
      this.router.navigate(['/auth/login']);
    }
  }
}
