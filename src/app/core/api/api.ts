import { DEFAULT_API_BASE, getApiBase } from './api-base';
import { HttpClient, HttpContext } from '@angular/common/http';
import { BACKGROUND_REQUEST } from '../loading/loading-interceptor';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { clearSession } from '../auth/token-storage';
import { UserStore } from '../store/user';

// The Authorization header is added by tokenInterceptor; refresh on 401 is
// handled by errorInterceptor.
@Injectable({
  providedIn: 'root',
})
export class Api {
  constructor(
    private http: HttpClient,
    private router: Router,
    private userStore: UserStore,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Components render errors themselves (see shared/feedback), so this never
  // shows a blocking alert — it only ends a session the server no longer accepts.
  // `silent` skips the redirect to login (used by pre-login pages). `tokenless` requests (to the
  // default instance) carry no token, so their 401 says nothing about the session.
  private handleError(err: any, silent = false, tokenless = false) {

    if (err?.status === 401 && !tokenless) {
      clearSession();
      this.userStore.clearUser();
      if (!silent && isPlatformBrowser(this.platformId)) {
        const current = this.router.url;
        this.router.navigate(['/auth/login'], {
          queryParams: current.startsWith('/main') ? { returnUrl: current } : {}
        });
      }
    }

    return throwError(() => err);
  }

  POST(url: string, payload: any, options?: { silent?: boolean }) {
    return this.http.post(`${getApiBase()}/${url}`, payload).pipe(
      catchError((err) => this.handleError(err, options?.silent))
    );
  }

  // Same as POST, but emits HttpEvents (upload progress, then the response)
  // so long uploads can show a progress indicator.
  POSTWithProgress(url: string, payload: any) {
    return this.http.post(`${getApiBase()}/${url}`, payload, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  // `useDefaultBase` is for pre-login lookups (the college list, finding a college's host): they must
  // not depend on the instance of a previously chosen college being up. Such requests carry no token.
  // `background` marks polling requests, which don't show the global progress bar.
  GET(url: string, params?: any, options?: { useDefaultBase?: boolean; background?: boolean }) {
    const base = options?.useDefaultBase ? DEFAULT_API_BASE : getApiBase();
    const context = new HttpContext().set(BACKGROUND_REQUEST, !!options?.background);
    return this.http.get(`${base}/${url}`, { params, context }).pipe(
      catchError((err) => this.handleError(err, options?.useDefaultBase, options?.useDefaultBase))
    );
  }

  GETBlob(url: string) {
    return this.http.get(`${getApiBase()}/${url}`, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  PUT(url: string, payload: any) {
    return this.http.put(`${getApiBase()}/${url}`, payload).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  DELETE(url: string) {
    return this.http.delete(`${getApiBase()}/${url}`).pipe(
      catchError((err) => this.handleError(err))
    );
  }
}
