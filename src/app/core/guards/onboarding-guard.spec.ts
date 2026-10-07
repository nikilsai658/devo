import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { onboardingGuard, onboardingStepGuard, pendingOnboardingStep } from './onboarding-guard';
import { signIn, testProviders } from '../../../testing/test-providers';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

function url(result: unknown): string {
  return TestBed.inject(Router).serializeUrl(result as UrlTree);
}

describe('onboarding guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: testProviders() });
  });

  it('sends a first login to the password change before the app', () => {
    signIn([], { isFirstLogin: true, profileCompleted: false });
    expect(pendingOnboardingStep()).toBe('/changepassword');
    expect(url(TestBed.runInInjectionContext(() => onboardingGuard(route, state)))).toBe('/changepassword');
  });

  it('then requires the profile', () => {
    signIn([], { isFirstLogin: false, profileCompleted: false });
    expect(url(TestBed.runInInjectionContext(() => onboardingGuard(route, state)))).toBe('/profile');
  });

  it('lets a finished user into the app', () => {
    signIn();
    expect(TestBed.runInInjectionContext(() => onboardingGuard(route, state))).toBe(true);
  });

  it('opens a step page only while that step is due', () => {
    signIn([], { isFirstLogin: true });
    const password = onboardingStepGuard('/changepassword');
    const profile = onboardingStepGuard('/profile');
    expect(TestBed.runInInjectionContext(() => password(route, state))).toBe(true);
    expect(url(TestBed.runInInjectionContext(() => profile(route, state)))).toBe('/changepassword');

    signIn();
    expect(url(TestBed.runInInjectionContext(() => password(route, state)))).toBe('/main');
  });
});
