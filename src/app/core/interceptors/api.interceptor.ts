import type { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "environments/environment.development";

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = environment.apiUrl;
  let apiReq = req.clone({
    url: `${apiUrl}/${req.url}`,
    withCredentials: true,
  });

  const token = localStorage.getItem('token');
  if (token && !apiReq.headers.has('Authorization')) {
    apiReq = apiReq.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(apiReq);
};
