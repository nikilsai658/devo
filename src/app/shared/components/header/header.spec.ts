import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { Header } from './header';
import { setApiBase } from '../../../core/api/api-base';
import { UserStore } from '../../../core/store/user';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let backend: HttpTestingController;

  async function create(profile: Record<string, unknown> = {}) {
    signIn(['VIEW_USER'], profile);
    await TestBed.configureTestingModule({ imports: [Header], providers: testProviders() }).compileComponents();
    fixture = TestBed.createComponent(Header);
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    backend.match(`${API}/FacultyCourse/my`).forEach(r => r.flush({ data: [] }));
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setApiBase(API);
  });

  afterEach(() => localStorage.clear());

  it('signs out locally even when the server logout fails', async () => {
    await create();
    sessionStorage.setItem('activeAssignmentId', '5');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.logout();

    // The request still carried the token, so the server can revoke the session...
    const req = backend.expectOne(`${API}/Auth/logout-all`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');
    // ...and the browser is already signed out before it answers.
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(sessionStorage.getItem('activeAssignmentId')).toBeNull();
    expect(TestBed.inject(UserStore).user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/auth/login']);

    req.flush(null, { status: 500, statusText: 'Server Error' });
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('shows a bundled college logo', async () => {
    await create({ collegeName: 'Jain University' });
    const img = fixture.nativeElement.querySelector('.college-brand img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('assets/images/jain-logo.png');
  });

  it('shows initials for a college without a bundled logo', async () => {
    await create({ collegeName: 'Tirupati Institute of Technology' });
    const brand = fixture.nativeElement.querySelector('.college-brand') as HTMLElement;
    expect(brand.querySelector('img')).toBeNull();
    expect(brand.textContent).toContain('TI');
    expect(brand.textContent).toContain('Tirupati Institute of Technology');
  });

  it('only shows menu links the user may open', async () => {
    await create();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a[href]')).map((a: any) => a.getAttribute('href'));
    expect(links).toContain('/main/user');
    expect(links).not.toContain('/main/deployments');
  });
});
