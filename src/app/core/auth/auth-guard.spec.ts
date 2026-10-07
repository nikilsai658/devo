import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { authGuard } from './auth-guard';
import { testProviders } from '../../../testing/test-providers';

function run(url: string) {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));
}

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: testProviders() });
  });

  it('lets a signed-in user through', () => {
    localStorage.setItem('token', 't');
    expect(run('/main/user')).toBe(true);
  });

  it('sends a signed-out user to login, remembering the app page', () => {
    const tree = run('/main/user?page=2') as UrlTree;
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(tree)).toBe('/auth/login?returnUrl=%2Fmain%2Fuser%3Fpage%3D2');
  });

  it('does not carry non-app pages as a return address', () => {
    const tree = run('/changepassword') as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe('/auth/login');
  });
});
