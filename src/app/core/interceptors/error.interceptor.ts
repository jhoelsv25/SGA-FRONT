import type { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  //const toast = inject(ToastService);
  return next(req).pipe(
    tap(() => console.log('✅ [ErrorInterceptor] Request successful:', req.url)),
    catchError((error: HttpErrorResponse) => {
      // No mostrar toast para errores 401 (se manejan en el auth interceptor)
      if (error.status === 401) {
        return throwError(() => error);
      }

      let errorMsg = '';
      if (error?.error) {
        if (typeof error.error === 'string') {
          errorMsg = error.error;
        } else if (error.error.message) {
          errorMsg = error.error.message;
        } else {
          errorMsg = JSON.stringify(error.error);
        }
      } else if (error?.message) {
        errorMsg = error.message;
      } else {
        errorMsg = 'Error desconocido';
      }
      return throwError(() => errorMsg);
    }),
  );
};
