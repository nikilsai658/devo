import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { Api } from './api';
import { DEFAULT_API_BASE, setApiBase } from './api-base';
import { UserStore } from '../store/user';
import { Loading } from '../loading/loading';
import { signIn, testProviders } from '../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('Api', () => {
  let api: Api;
  let backend: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    setApiBase(API);
    signIn();
    TestBed.configureTestingModule({ providers: testProviders() });
    api = TestBed.inject(Api);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('calls the selected college instance', () => {
    api.GET('User', { RoleName: 'Student' }).subscribe();
    const req = backend.expectOne(r => r.url === `${API}/User`);
    expect(req.request.params.get('RoleName')).toBe('Student');
    req.flush({});
  });

  it('uses the default instance only for pre-login lookups, without a token', () => {
    api.GET('College', undefined, { useDefaultBase: true }).subscribe();
    const req = backend.expectOne(`${DEFAULT_API_BASE}/College`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('ends the session on a 401 and goes to login with the page to return to', async () => {
    await router.navigateByUrl('/main/user?x=1');
    const navigate = vi.spyOn(router, 'navigate');

    let status = 0;
    api.GET('User').subscribe({ error: e => (status = e.status) });
    backend.expectOne(`${API}/User`).flush(null, { status: 401, statusText: 'Unauthorized' });
    // The refresh is attempted first and rejected too.
    backend.expectOne(`${API}/Auth/refresh-token`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(TestBed.inject(UserStore).user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: '/main/user?x=1' } });
  });

  it('does not sign the user out when a pre-login lookup returns 401', () => {
    api.GET('College', undefined, { useDefaultBase: true }).subscribe({ error: () => {} });
    backend.expectOne(`${DEFAULT_API_BASE}/College`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(localStorage.getItem('token')).toBe('access-token');
  });

  it('shows the global progress bar for normal requests but not for background polls', () => {
    const loading = TestBed.inject(Loading);

    api.GET('Ticket/1').subscribe();
    expect(loading.active()).toBe(true);
    backend.expectOne(`${API}/Ticket/1`).flush({});
    expect(loading.active()).toBe(false);

    api.GET('Ticket/1/messages', undefined, { background: true }).subscribe();
    expect(loading.active()).toBe(false);
    backend.expectOne(`${API}/Ticket/1/messages`).flush({});
  });
});
