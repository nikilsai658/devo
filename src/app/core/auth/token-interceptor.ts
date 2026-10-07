import { HttpInterceptorFn } from '@angular/common/http';
import { isApiRequest } from '../api/api-base';
import { getAccessToken } from './token-storage';

// Adds the bearer token, but only to the selected college's API (see isApiRequest).
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {

  const token = getAccessToken();

  if (token && isApiRequest(req.url)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
