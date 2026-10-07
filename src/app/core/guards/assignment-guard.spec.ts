import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { assignmentGuard } from './assignment-guard';
import { testProviders } from '../../../testing/test-providers';

const run = () => TestBed.runInInjectionContext(() =>
  assignmentGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

describe('assignmentGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: testProviders() });
  });

  it('allows an assignment started from the course page', () => {
    sessionStorage.setItem('activeAssignmentId', '12');
    expect(run()).toBe(true);
  });

  it('otherwise sends the student to an existing page (the start of the student flow)', () => {
    const tree = run() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe('/main/student-domain');
  });
});
