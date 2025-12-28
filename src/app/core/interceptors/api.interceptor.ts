import type { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "environments/environment.development";

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = environment.apiUrl;
  const apiReq = req.clone({
    url: `${apiUrl}/${req.url}`,
    withCredentials: true,
  });
  req = apiReq;
  return next(req);
};
