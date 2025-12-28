import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { AuthStore } from './auth.store';
import { LoginCredentials } from '@auth/types/auth-type';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private store = inject(AuthStore);
  private router = inject(Router);

  /** LOGIN → retorna boolean en vez de strings */
  login(credentials: LoginCredentials): Observable<boolean> {
    return this.store.signIn(credentials).pipe(
      map((status) => {
        const success = status === 'success';
        return success;
      }),
      tap((success) => {
        if (success) {
          // Verificar si el usuario tiene módulos
          const modules = this.getModules();
          if (!modules || modules.length === 0) {
            this.router.navigate(['/no-permissions']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          console.log('❌ [AuthFacade] Login falló');
        }
      }),
    );
  }

  /** LOGOUT */
  logout(): void {
    this.store.logout();
    this.router.navigate(['/auth/login']);
  }

  /** INITIALIZE → también lo traduzco a boolean */
  initialize(): Observable<boolean> {
    return this.store.checkToken().pipe(
      switchMap((status) => {
        if (status === 'valid') {
          // Verificar si el usuario tiene módulos después de validar el token
          const modules = this.getModules();
          if (!modules || modules.length === 0) {
            this.router.navigate(['/no-permissions']);
            return of(true); // Sigue siendo válido, solo sin permisos
          }
          return of(true);
        }

        // ❌ Token inválido → NO intentar refresh aquí
        // El refresh se hará automáticamente por el interceptor en la primera petición autenticada
        console.log('ℹ️ [AuthFacade] Token inválido, no hay sesión activa');
        this.store.logout(); // Limpiar estado
        return of(false); // Continuar sin autenticación
      }),
      catchError((error) => {
        // Si hay cualquier error en el proceso de inicialización, continuar sin autenticación
        console.error('❌ [AuthFacade] Error en inicialización:', error);
        this.store.logout();
        return of(false);
      }),
    );
  }

  /** REFRESH SESSION */
  refreshSession(): Observable<boolean> {
    return this.store.refreshToken().pipe(
      map((status) => status === 'refreshed'),
      tap((success) => {
        if (!success) this.logout();
      }),
    );
  }

  /** GETTERS para guards y vistas */

  isAuthenticated(): boolean {
    return this.store.isLoggedIn();
  }

  getCurrentUser() {
    return this.store.currentUser();
  }

  getModules() {
    return this.store.modules();
  }

  hasModule(module: string) {
    return this.store.hasModule(module);
  }

  hasPermission(perm: string) {
    return this.store.hasPermission(perm);
  }
}
