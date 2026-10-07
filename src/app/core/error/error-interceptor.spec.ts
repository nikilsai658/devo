import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

import { setApiBase } from '../api/api-base';
import { signIn, testProviders } from '../../../testing/test-providers';

const API = 'https://tit.example.test/api';
const REFRESH = `${API}/Auth/refresh-token`;

describe('errorInterceptor (token refresh)', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    setApiBase(API);
    signIn();
    TestBed.configureTestingModule({ providers: testProviders() });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('refreshes once on a 401 and retries the request with the new token', () => {
    let result: unknown;
    http.get(`${API}/User`).subscribe(r => (result = r));

    backend.expectOne(`${API}/User`).flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = backend.expectOne(REFRESH);
    expect(refresh.request.body).toEqual({ userId: 'u-1', refreshToken: 'refresh-token' });
    refresh.flush({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });

    const retry = backend.expectOne(`${API}/User`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(localStorage.getItem('token')).toBe('new-access');
    expect(localStorage.getItem('refresh')).toBe('new-refresh');
  });

  it('shares one refresh between concurrent 401s', () => {
    const results: unknown[] = [];
    http.get(`${API}/A`).subscribe(r => results.push(r));
    http.get(`${API}/B`).subscribe(r => results.push(r));

    backend.expectOne(`${API}/A`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${API}/B`).flush(null, { status: 401, statusText: 'Unauthorized' });

    backend.expectOne(REFRESH).flush({ data: { accessToken: 'new-access' } });

    backend.expectOne(`${API}/A`).flush('a');
    backend.expectOne(`${API}/B`).flush('b');
    expect(results.sort()).toEqual(['a', 'b']);
  });

  it('fails every waiting request when the refresh fails (none is left hanging)', () => {
    const errors: number[] = [];
    http.get(`${API}/A`).subscribe({ error: e => errors.push(e.status) });
    http.get(`${API}/B`).subscribe({ error: e => errors.push(e.status) });

    backend.expectOne(`${API}/A`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${API}/B`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(REFRESH).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errors).toEqual([401, 401]);
  });

  it('fails when the refresh response has no access token', () => {
    let status = 0;
    http.get(`${API}/A`).subscribe({ error: e => (status = e.status) });
    backend.expectOne(`${API}/A`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(REFRESH).flush({ data: {} });
    expect(status).toBe(401);
  });

  it('retries with the current token when another request already refreshed it', () => {
    http.get(`${API}/A`).subscribe();
    localStorage.setItem('token', 'already-refreshed');
    backend.expectOne(`${API}/A`).flush(null, { status: 401, statusText: 'Unauthorized' });
    const retry = backend.expectOne(`${API}/A`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer already-refreshed');
    retry.flush({});
  });

  it('does not refresh for the login call or for other hosts', () => {
    let loginStatus = 0;
    let otherStatus = 0;
    http.post(`${API}/Auth/login`, {}).subscribe({ error: e => (loginStatus = e.status) });
    http.get('https://other.example.test/x').subscribe({ error: e => (otherStatus = e.status) });
    backend.expectOne(`${API}/Auth/login`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('https://other.example.test/x').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone(REFRESH);
    expect(loginStatus).toBe(401);
    expect(otherStatus).toBe(401);
  });
});
