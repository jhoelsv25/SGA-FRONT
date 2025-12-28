import { inject } from '@angular/core';
import { CurrentUser, LoginCredentials, Module } from '@auth/types/auth-type';

import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, catchError, map, timeout, tap } from 'rxjs/operators';
import { AuthApi } from '../api/auth-api';
import { TokenManager } from '../api/token-manager';

interface AuthState {
  currentUser: CurrentUser | null;
  modules: Module[];
  isLoggedIn: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  returnUrl: string | null;
  isRefreshing: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  modules: [],
  isLoggedIn: false,
  isInitialized: false,
  isLoading: false,
  error: null,
  returnUrl: null,
  isRefreshing: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, authService = inject(AuthApi), tokenService = inject(TokenManager)) => {
    let refreshTokenSubject: BehaviorSubject<string | null> | null = null;

    return {
      /* ===========================
         LOGIN (Puro, sin navegación)
      =========================== */
      signIn: (credentials: LoginCredentials): Observable<'success' | 'error'> => {
        patchState(store, { isLoading: true, error: null });

        return authService.login(credentials).pipe(
          switchMap((response) => {
            console.log('✅ [AuthStore] Login exitoso para usuario:', response);
            tokenService.setToken(response.accessToken);
            patchState(store, {
              currentUser: response.user,
              isLoggedIn: true,
              isInitialized: true,
              isLoading: !response.modules?.length,
              modules: response.modules || [],
            });

            if (!response.modules?.length) {
              return authService.getModulesByRole(response.user.role.id).pipe(
                tap((res) => {
                  patchState(store, {
                    modules: res.modules,
                    isLoading: false,
                  });
                }),
                map(() => 'success' as const),
                catchError(() => {
                  patchState(store, { modules: [], isLoading: false });
                  return of('success' as const);
                }),
              );
            }

            return of('success' as const);
          }),
          catchError((error) => {
            tokenService.removeToken();
            patchState(store, {
              ...initialState,
              isInitialized: true,
              error: error.message || 'Login failed',
            });
            return of('error' as const);
          }),
        );
      },

      /* ===========================
         LOGOUT (Puro, sin Navegación)
      =========================== */
      logout: (): 'loggedOut' => {
        tokenService.removeToken();
        patchState(store, { ...initialState, isInitialized: true });
        return 'loggedOut';
      },
      checkToken: (): Observable<'valid' | 'invalid'> => {
        const token = tokenService.getToken();
        const hasData = store.currentUser() && store.modules().length > 0;

        // Si no hay token, definitivamente es inválido
        if (!token) {
          patchState(store, { ...initialState, isInitialized: true });
          return of('invalid' as const);
        }

        // Si tenemos token y datos en memoria, considerarlo válido
        if (hasData) {
          patchState(store, { isInitialized: true, isLoggedIn: true });
          return of('valid' as const);
        }

        // Si el token está expirado localmente, NO llamar al backend
        // Simplemente marcarlo como inválido y dejar que el interceptor maneje el refresh
        if (!tokenService.isValidToken()) {
          console.log('⚠️ [AuthStore] Token expirado localmente');
          return of('invalid' as const);
        }

        // Token válido localmente pero sin datos → verificar con el backend
        return authService.checkToken().pipe(
          timeout(10000),
          map((response) => {
            patchState(store, {
              currentUser: response.user,
              modules: response.modules || [],
              isLoggedIn: true,
              isInitialized: true,
            });
            return 'valid' as const;
          }),
          catchError((error) => {
            console.error('❌ [AuthStore] Error verificando token:', error);
            tokenService.removeToken();
            patchState(store, { ...initialState, isInitialized: true });
            return of('invalid' as const);
          }),
        );
      },

      /* ===========================
         REFRESH TOKEN (Puro)
      =========================== */
      refreshToken: (): Observable<'refreshed' | 'failed'> => {
        if (store.isRefreshing() && refreshTokenSubject) {
          return refreshTokenSubject.asObservable().pipe(
            map(() => 'refreshed' as const),
            catchError(() => of('failed' as const)),
          );
        }

        patchState(store, { isRefreshing: true });
        refreshTokenSubject = new BehaviorSubject<string | null>(null);

        return authService.refreshToken().pipe(
          timeout(15000),
          switchMap((response) => {
            tokenService.setToken(response.data.accessToken);

            const updateStore = (modules: Module[]) => {
              patchState(store, {
                currentUser: response.data.user, // ✅ Actualizar usuario
                modules,
                isLoggedIn: true,
                isInitialized: true,
                isRefreshing: false,
              });
              refreshTokenSubject?.next(response.data.accessToken);
              refreshTokenSubject?.complete();
              refreshTokenSubject = null;
            };

            if (store.modules().length > 0) {
              updateStore(store.modules());
              return of('refreshed' as const);
            }
            return authService.getModulesByRole(response.data.user.role.id).pipe(
              map((res) => {
                updateStore(res.modules || []);
                return 'refreshed' as const;
              }),
              catchError((err) => {
                console.error('❌ [AuthStore] Error obteniendo módulos:', err);
                updateStore([]);
                return of('refreshed' as const);
              }),
            );
          }),
          catchError((error) => {
            console.error('❌ [AuthStore] Error en refreshToken:', error);
            patchState(store, {
              ...initialState,
              isInitialized: true,
              isRefreshing: false,
            });
            refreshTokenSubject?.error(null);
            refreshTokenSubject = null;
            return of('failed' as const);
          }),
        );
      },
      hasModule: (moduleKey: string): boolean => {
        const flatten = (mods: Module[]): Module[] =>
          mods.reduce((acc, mod) => {
            acc.push(mod);
            if (mod.children) acc.push(...flatten(mod.children));
            return acc;
          }, [] as Module[]);

        const allModules = flatten(store.modules());

        return allModules.some(
          (mod) =>
            mod.name?.toLowerCase() === moduleKey.toLowerCase() ||
            mod.path?.toLowerCase() === moduleKey.toLowerCase(),
        );
      },

      hasPermission: (permission: string): boolean => {
        const flatten = (mods: Module[]): string[] =>
          mods.reduce((acc, mod) => {
            if (mod.permissions) acc.push(...mod.permissions);
            if (mod.children) acc.push(...flatten(mod.children));
            return acc;
          }, [] as string[]);

        const allPermissions = flatten(store.modules());
        return allPermissions.includes(permission);
      },
    };
  }),
);
