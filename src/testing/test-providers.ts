import { Component, EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Routes } from '@angular/router';
import { tokenInterceptor } from '../app/core/auth/token-interceptor';
import { errorInterceptor } from '../app/core/error/error-interceptor';
import { loadingInterceptor } from '../app/core/loading/loading-interceptor';

// Any URL a test navigates to lands here.
@Component({ template: '' })
export class BlankPage {}

// What every component/service test needs: the app's HTTP pipeline against
// HttpTestingController (no real network) and a router.
export function testProviders(routes: Routes = []): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withInterceptors([tokenInterceptor, errorInterceptor, loadingInterceptor])),
    provideHttpClientTesting(),
    provideRouter([...routes, { path: '**', component: BlankPage }])
  ];
}

// A signed-in session in localStorage, as login leaves it.
export function signIn(permissions: string[] = [], profile: Record<string, unknown> = {}): void {
  localStorage.setItem('token', 'access-token');
  localStorage.setItem('refresh', 'refresh-token');
  localStorage.setItem('user', JSON.stringify({
    userId: 'u-1',
    name: 'Test User',
    role: 'Admin',
    collegeName: 'Test College',
    isFirstLogin: false,
    profileCompleted: true,
    permissions: permissions.map(code => ({ code })),
    ...profile
  }));
}
