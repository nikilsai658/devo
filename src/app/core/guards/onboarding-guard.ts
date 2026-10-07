import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { readStoredUser } from '../auth/token-storage';

// Where a signed-in user must go before using the app, or null when they are done:
// a first login must change the password, then the profile must be completed.
// Mirrors the redirect done right after login. The API must enforce the same rule;
// this only keeps the UI from skipping the steps.
export function pendingOnboardingStep(): string | null {

  const user = readStoredUser();

  if (user?.['isFirstLogin'] === true) {
    return '/changepassword';
  }

  if (user?.['profileCompleted'] === false) {
    return '/profile';
  }

  return null;

}

// For the app (/main): sends users with an unfinished first-login step to it.
export const onboardingGuard: CanActivateFn = () => {

  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  const step = pendingOnboardingStep();

  return step ? inject(Router).createUrlTree([step]) : true;

};

// For the first-login pages themselves: only the step that is actually due may be opened.
export const onboardingStepGuard = (step: '/changepassword' | '/profile'): CanActivateFn => () => {

  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  const due = pendingOnboardingStep();

  if (due === step) {
    return true;
  }

  return inject(Router).createUrlTree([due ?? '/main']);

};
