import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Route, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { firstPermittedPath, permissionGuard } from './permission-guard';
import { routes } from '../../app.routes';
import { signIn, testProviders } from '../../../testing/test-providers';

const mainChildren = routes.find(r => r.path === 'main')!.children!;

function child(path: string): Route {
  const found = mainChildren.find(r => r.path === path);
  if (!found) throw new Error('no route ' + path);
  return found;
}

describe('permission guard and route permissions', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: testProviders() });
  });

  it('protects each page with the same permission the menu uses', () => {
    expect(child('user').data?.['permission']).toBe('VIEW_USER');
    expect(child('leadership').data?.['permission']).toBe('LEADERBOARD_DOMAIN');
    expect(child('student-assignments').data?.['permission']).toBe('VIEW_STUDENT_COURSES');
    expect(child('student-task').data?.['permission']).toBe('VIEW_STUDENT_COURSES');
    expect(child('student-assignment').data?.['permission']).toBe('VIEW_STUDENT_COURSES');
    expect(child('superadmin-colleges').data?.['permission']).toBe('VIEW_SUPERADMIN_COLLEGES');
  });

  it('keeps the old misspelled superadmin address working', () => {
    expect(child('superamin-colleges').redirectTo).toBe('superadmin-colleges');
  });

  it('lands each role on the first page it may open', () => {
    signIn(['VIEW_STUDENT_DOMAIN']);
    expect(firstPermittedPath(mainChildren)).toBe('student-domain');
    signIn(['VIEW_SUPERADMIN_COLLEGES', 'VIEW_STUDENT_DOMAIN']);
    expect(firstPermittedPath(mainChildren)).toBe('superadmin-colleges');
  });

  it('redirects a page the user may not open to one they may', () => {
    signIn(['VIEW_STUDENT_DOMAIN']);
    const route = {
      data: { permission: 'VIEW_USER' },
      parent: { routeConfig: { children: mainChildren }, pathFromRoot: [{ url: [] }, { url: [{ path: 'main' }] }] }
    } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => permissionGuard(route, {} as RouterStateSnapshot));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/main/student-domain');
  });

  it('lets a permitted user through', () => {
    signIn(['VIEW_USER']);
    const route = { data: { permission: 'VIEW_USER' } } as unknown as ActivatedRouteSnapshot;
    expect(TestBed.runInInjectionContext(() => permissionGuard(route, {} as RouterStateSnapshot))).toBe(true);
  });
});
