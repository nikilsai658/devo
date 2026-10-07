import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { readStorage } from '../storage';

// An assignment is opened from the student's course list, which records it in sessionStorage.
// Opened any other way, the student goes back to the start of that flow.
export const assignmentGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const router = inject(Router);

  if (readStorage('activeAssignmentId', 'session')) {
    return true;
  }

  return router.createUrlTree(['/main/student-domain']);
};
