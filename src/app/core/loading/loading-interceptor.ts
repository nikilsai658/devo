import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { Loading } from './loading';

// Set on requests that run in the background (polling) so they don't flash the progress bar.
export const BACKGROUND_REQUEST = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {

  if (req.context.get(BACKGROUND_REQUEST)) {
    return next(req);
  }

  const loading = inject(Loading);

  loading.start();

  return next(req).pipe(finalize(() => loading.stop()));
};
