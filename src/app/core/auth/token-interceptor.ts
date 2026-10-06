import { HttpInterceptorFn } from '@angular/common/http';
import { getAccessToken } from './token-storage';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {

  const token = getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};