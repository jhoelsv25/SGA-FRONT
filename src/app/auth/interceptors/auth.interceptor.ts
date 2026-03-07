import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenManager } from '@auth/services/api/token-manager';

import { AuthFacade } from '@auth/services/store/auth.acede';
import { catchError, throwError, switchMap, filter, take, Observable, BehaviorSubject } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function shouldSkipRefresh(url: string): boolean {

  const skipPaths = [
    'auth/login',
    'auth/refresh-token',
    'auth/logout',
    'auth/forgot-password',
    'auth/reset-password',
  ];
  return skipPaths.some((path) => url.includes(path));
}

function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenManager);
  const authFacade = inject(AuthFacade);

  const token = tokenService.getToken();
  if (token && !shouldSkipRefresh(req.url)) {
    req = addToken(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !shouldSkipRefresh(req.url) && token) {
        return handle401Error(req, next, tokenService, authFacade);
      }

      return throwError(() => error);
    }),
  );
};

function handle401Error(
  request: HttpRequest<unknown>,
  next: (req: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>,
  tokenService: TokenManager,
  authFacade: AuthFacade,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next(addToken(request, token!))),
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  return authFacade.refreshSession().pipe(
    switchMap((success: boolean) => {
      if (!success) {
        throw new Error('Refresh token failed');
      }

      const newToken = tokenService.getToken();
      if (!newToken) {
        throw new Error('No token after refresh');
      }

      isRefreshing = false;
      refreshTokenSubject.next(newToken);
      return next(addToken(request, newToken));
    }),
    catchError((refreshError) => {
      isRefreshing = false;
      refreshTokenSubject.next(null);

      console.error('❌ [Interceptor] Refresh fallido, cerrando sesión');
      authFacade.logout();
      return throwError(() => refreshError);
    }),
  );
}
