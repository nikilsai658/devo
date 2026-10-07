import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { readStorage } from '../storage';

// Auth pages post collegeCode to the API; without it the request fails.
// Send the user to pick a college first, then bring them back.
export const collegeGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (readStorage('collegecode')) {
    return true;
  }

  return inject(Router).createUrlTree(['/auth/college'], {
    queryParams: { returnUrl: state.url }
  });
};
