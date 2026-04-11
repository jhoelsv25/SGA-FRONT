import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthFacade } from '@auth/services/store/auth.acede';
import { catchError, throwError, switchMap, filter, take, Observable, BehaviorSubject } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

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

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !shouldSkipRefresh(req.url)) {
        return handle401Error(req, next, authFacade);
      }

      return throwError(() => error);
    }),
  );
};

function handle401Error(
  request: HttpRequest<unknown>,
  next: (req: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>,
  authFacade: AuthFacade,
): Observable<HttpEvent<unknown>> {
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter((result) => result !== null),
      take(1),
      switchMap((result) =>
        result ? next(request) : throwError(() => new Error('Refresh token failed')),
      ),
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  return authFacade.refreshSession().pipe(
    switchMap((success: boolean) => {
      if (!success) {
        throw new Error('Refresh token failed');
      }

      isRefreshing = false;
      refreshTokenSubject.next(true);
      return next(request);
    }),
    catchError((refreshError) => {
      isRefreshing = false;
      refreshTokenSubject.next(false);

      console.error('❌ [Interceptor] Refresh fallido, cerrando sesión');
      authFacade.logout();
      return throwError(() => refreshError);
    }),
  );
}
