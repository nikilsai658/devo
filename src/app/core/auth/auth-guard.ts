import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { getAccessToken } from './token-storage';

export const authGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const router = inject(Router);

  if (getAccessToken()) {
    return true;
  }

  // Login sends the user back here afterwards (see safeReturnUrl in login.ts).
  return router.createUrlTree(['/auth/login'], {
    queryParams: state.url.startsWith('/main') ? { returnUrl: state.url } : {}
  });
};
