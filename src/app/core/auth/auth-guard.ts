import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { getAccessToken } from './token-storage';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const router = inject(Router);

  if (getAccessToken()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
