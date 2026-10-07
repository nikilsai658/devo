import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthServices } from '../../features/services/auth/auth-services';
import { isApiRequest } from '../api/api-base';
import { getAccessToken, getRefreshToken, readStoredUser, setTokens } from '../auth/token-storage';

// Module-level so concurrent 401s share one refresh call. Every waiting request
// subscribes to the same observable, so they all get the new token — or all get
// the error when the refresh fails (none is left waiting forever).
let refreshInFlight: Observable<string> | null = null;

function refreshAccessToken(authServices: AuthServices, original: HttpErrorResponse): Observable<string> {

  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refreshToken = getRefreshToken();
  // The refresh endpoint needs the user's id (TokenResponseDto.userId), kept in the stored profile.
  const userId = readStoredUser()?.['userId'];

  if (!refreshToken || !userId) {
    return throwError(() => original);
  }

  refreshInFlight = authServices.refreshToken(userId, refreshToken).pipe(
    map((res: any) => {
      const data = res?.data || res;
      if (!data?.accessToken) {
        throw original;
      }
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken as string;
    }),
    finalize(() => {
      refreshInFlight = null;
    }),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  return refreshInFlight;

}

function withAuthHeader(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {

  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  const authServices = inject(AuthServices);

  // Never attempt a refresh for the login/refresh calls themselves —
  // that would loop forever if the refresh token is also invalid.
  const isAuthRoute =
    req.url.includes('Auth/login') ||
    req.url.includes('Auth/refresh-token');

  return next(req).pipe(

    catchError((error: unknown) => {

      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthRoute ||
        // Only the selected college's API is sent a token, so only its 401s mean "token expired".
        !isApiRequest(req.url)
      ) {
        return throwError(() => error);
      }

      // Another request already refreshed the token after this one was sent: just retry.
      const current = getAccessToken();
      if (current && req.headers.get('Authorization') !== `Bearer ${current}`) {
        return next(withAuthHeader(req, current));
      }

      // If the refresh fails, Api's own 401 handling clears the session and goes to login.
      return refreshAccessToken(authServices, error).pipe(
        switchMap(token => next(withAuthHeader(req, token)))
      );

    })

  );

};
