import { inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, Route, Router, Routes } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { readStoredUser } from '../auth/token-storage';

// Reads the stored profile directly rather than going through UserStore/Auth:
// this guard runs during route resolution and needs the permissions
// synchronously, independent of when the store's signal is populated.
function getStoredPermissions(): any[] {

  const permissions = readStoredUser()?.['permissions'];

  return Array.isArray(permissions) ? permissions : [];

}

// Picks the first route (in declaration order) whose required permission the
// user holds, so each role lands on a page it can actually open.
export function firstPermittedPath(routes: Routes): string | undefined {

  const codes = new Set(getStoredPermissions().map((p: any) => p.code));

  return routes.find((r: Route) =>
    !!r.path &&
    !r.path.includes(':') &&
    !!r.data?.['permission'] &&
    codes.has(r.data['permission'])
  )?.path;

}

// Default child redirect for /main. The server can't read localStorage, so it
// keeps the old default there; permissionGuard reroutes on the client if needed.
export function defaultChildRedirect(routes: Routes): () => string {

  return () => {

    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return 'student-domain';
    }

    return firstPermittedPath(routes) ?? 'profile';

  };

}

function parentUrl(route: ActivatedRouteSnapshot): string[] {

  return ['/', ...(route.parent?.pathFromRoot ?? [])
    .flatMap(r => r.url.map(s => s.path))];

}

export const permissionGuard: CanActivateChildFn = (route) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const router = inject(Router);

  const permission = route.data['permission'] as string | undefined;

  if (!permission) {
    return true;
  }

  const hasPermission = getStoredPermissions()
    .some((p: any) => p.code === permission);

  if (hasPermission) {
    return true;
  }

  // No access: send the user to the first page they are allowed to see.
  const siblings = route.parent?.routeConfig?.children ?? [];
  const fallback = firstPermittedPath(siblings);

  if (fallback) {
    return router.createUrlTree([...parentUrl(route), fallback]);
  }

  return router.createUrlTree(['/page-not-found']);
};
