import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { Login, safeReturnUrl } from './login';
import { setApiBase } from '../../../core/api/api-base';
import { testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let backend: HttpTestingController;
  let router: Router;
  let returnUrl: string | null = null;

  async function create() {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        ...testProviders(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) } } }
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  function submit(user = 'priya@college.edu') {
    component.Form.patchValue({ userNameOrEmail: user, password: 'Secret#123' });
    component.onSubmit();
  }

  function respond(data: Record<string, unknown>) {
    backend.expectOne(`${API}/Auth/login`).flush({
      data: { accessToken: 'acc', refreshToken: 'ref', userId: 'u1', name: 'Priya', isFirstLogin: false, profileCompleted: true, permissions: [], ...data }
    });
  }

  beforeEach(() => {
    localStorage.clear();
    setApiBase(API);
    localStorage.setItem('collegecode', 'TIT');
    returnUrl = null;
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('stores the tokens separately and never inside the profile', async () => {
    await create();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    submit();
    respond({});
    expect(localStorage.getItem('token')).toBe('acc');
    expect(localStorage.getItem('refresh')).toBe('ref');
    const profile = localStorage.getItem('user')!;
    expect(profile).not.toContain('acc');
    expect(profile).not.toContain('ref');
    expect(JSON.parse(profile).name).toBe('Priya');
    expect(navigate).toHaveBeenCalledWith('/main');
  });

  it('sends a first login to the password change', async () => {
    await create();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    submit();
    respond({ isFirstLogin: true, profileCompleted: false });
    expect(navigate).toHaveBeenCalledWith('/changepassword');
  });

  it('returns to the app page that asked for the login', async () => {
    returnUrl = '/main/user?page=2';
    await create();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    submit();
    respond({});
    expect(navigate).toHaveBeenCalledWith('/main/user?page=2');
  });

  it('ignores a return address outside the app (no open redirect)', () => {
    expect(safeReturnUrl('/main/user')).toBe('/main/user');
    expect(safeReturnUrl('/main')).toBe('/main');
    expect(safeReturnUrl('https://evil.test')).toBeNull();
    expect(safeReturnUrl('//evil.test/main')).toBeNull();
    expect(safeReturnUrl('/mainevil')).toBeNull();
    expect(safeReturnUrl('/main/\\evil')).toBeNull();
    expect(safeReturnUrl(null)).toBeNull();
  });

  it('does not remember usernames unless asked to', async () => {
    await create();
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    submit();
    respond({});
    expect(localStorage.getItem('recentUsers')).toBeNull();
  });

  it('remembers usernames after opting in, and forgets them when switched off', async () => {
    await create();
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.setRememberMe(true);
    submit('priya@college.edu');
    respond({});
    expect(JSON.parse(localStorage.getItem('recentUsers')!)).toEqual(['priya@college.edu']);

    component.setRememberMe(false);
    expect(localStorage.getItem('recentUsers')).toBeNull();
    expect(component.recentUsers).toEqual([]);
  });

  it('drops a username list saved before remembering became opt-in', async () => {
    localStorage.setItem('recentUsers', '["someone@else.edu"]');
    await create();
    expect(component.recentUsers).toEqual([]);
    expect(localStorage.getItem('recentUsers')).toBeNull();
  });

  it('explains a rejected login instead of "session expired"', async () => {
    await create();
    submit();
    backend.expectOne(`${API}/Auth/login`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(component.errorMessage).toBe('Invalid username or password. Please try again.');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
