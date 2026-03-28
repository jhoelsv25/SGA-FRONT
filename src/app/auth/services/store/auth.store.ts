import { inject } from '@angular/core';
import { CurrentUser, LoginCredentials, Module } from '@auth/types/auth-type';

import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, catchError, map, timeout, tap } from 'rxjs/operators';
import { AuthApi } from '../api/auth-api';
import { TokenManager } from '../api/token-manager';
import { expandPermissionAliases } from '@core/utils/permission.utils';

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
      logout: (): 'loggedOut' => {
        tokenService.removeToken();
        patchState(store, { ...initialState, isInitialized: true });
        return 'loggedOut';
      },
      checkToken: (): Observable<'valid' | 'invalid'> => {
        const hasData = store.currentUser() && store.modules().length > 0;

        if (hasData) {
          patchState(store, { isInitialized: true, isLoggedIn: true });
          return of('valid' as const);
        }

        return authService.checkToken().pipe(
          timeout(10000),
          map((response) => {
            if (response?.accessToken) {
              tokenService.setToken(response.accessToken);
            }
            patchState(store, {
              currentUser: response.user,
              modules: response.modules || [],
              isLoggedIn: true,
              isInitialized: true,
            });
            return 'valid' as const;
          }),
          catchError((error) => {
            console.warn('⚠️ [AuthStore] check-token falló, intentando refresh:', error);
            return authService.refreshToken().pipe(
              timeout(15000),
              switchMap((response) => {
                tokenService.setToken(response.data.accessToken);
                const updateStore = (modules: Module[]) => {
                  patchState(store, {
                    currentUser: response.data.user,
                    modules,
                    isLoggedIn: true,
                    isInitialized: true,
                  });
                };
                return authService.getModulesByRole(response.data.user.role.id).pipe(
                  map((res) => {
                    updateStore(res.modules || []);
                    return 'valid' as const;
                  }),
                  catchError(() => {
                    updateStore([]);
                    return of('valid' as const);
                  }),
                );
              }),
              catchError((refreshError) => {
                console.error('❌ [AuthStore] Refresh fallido en init:', refreshError);
                tokenService.removeToken();
                patchState(store, { ...initialState, isInitialized: true });
                return of('invalid' as const);
              }),
            );
          }),
        );
      },
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
                currentUser: response.data.user,
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
        const aliases = expandPermissionAliases(permission);
        return aliases.some((candidate) => allPermissions.includes(candidate));
      },
    };
  }),
);
