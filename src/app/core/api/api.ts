import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, throwError ,catchError} from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { isPlatformBrowser } from '@angular/common';
@Injectable({
  providedIn: 'root',
})
export class Api {
  constructor(private http: HttpClient,private cookie:CookieService,private router:Router, @Inject(PLATFORM_ID) private platformId: Object){

  }
  private getHeaders(): HttpHeaders {

  if (!isPlatformBrowser(this.platformId)) {
    return new HttpHeaders();
  }

  const token = this.cookie.get('token');

  if (!token) {
    // No token yet (e.g. the pre-login college-select page) — send the
    // request without an Authorization header instead of redirecting;
    // a 401 from the backend is still handled by handleError().
    return new HttpHeaders();
  }

  return new HttpHeaders({
    Authorization: `Bearer ${token}`
  });
}

// Components render errors inline (see shared/feedback), so this never
// shows a blocking alert — it only clears stale auth on a 401.
// `silent` skips the redirect to login (used by pre-login pages).
private handleError(err: any, silent = false) {

  if (err.status === 401) {
    this.cookie.delete('token', '/');
    this.cookie.delete('refresh', '/');
    if (!silent && isPlatformBrowser(this.platformId)) {
      this.router.navigate(['/auth/login']);
    }
  }

  return throwError(() => err);
}

 POST(url: string, payload: any, options?: { silent?: boolean }) {

  return this.http.post(
    `http://localhost:5000/api/${url}`,
    payload,
    { headers: this.getHeaders() }
  ).pipe(

    catchError((err) => this.handleError(err, options?.silent))

  );

}
// Same as POST, but emits HttpEvents (upload progress, then the response)
// so long uploads can show a progress indicator.
POSTWithProgress(url: string, payload: any) {

  return this.http.post(
    `http://localhost:5000/api/${url}`,
    payload,
    {
      headers: this.getHeaders(),
      reportProgress: true,
      observe: 'events'
    }
  ).pipe(

    catchError((err) => this.handleError(err))

  );

}
GET(url: string, params?: any) {
  return this.http.get(`http://localhost:5000/api/${url}`, {
    headers: this.getHeaders(),
    params: params
  }).pipe(
    catchError((err) => this.handleError(err))
  );
}
  GETBlob(url: string) {
    return this.http.get(`http://localhost:5000/api/${url}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  PUT(url: string, payload: any) {
    return this.http.put(`http://localhost:5000/api/${url}`,payload,{  headers: this.getHeaders()  }).pipe(
      catchError((err) => this.handleError(err))
    )
  }

  DELETE(url: string) {
    return this.http.delete(`http://localhost:5000/api/${url}`,{  headers: this.getHeaders()  }).pipe(
      catchError((err) => this.handleError(err))
    )

  }
}
