import { Inject, Injectable, PLATFORM_ID, computed, effect, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, ResolveEnd, Router } from '@angular/router';

export type Theme = 'dark' | 'light';

// Only the logged-in app (/main/...) follows the user's theme choice.
// Public pages (home, login, forgot password, etc.) are always dark.
const THEMED_PREFIX = '/main';

@Injectable({
  providedIn: 'root'
})
export class ThemeStore {

  private _theme = signal<Theme>('dark');

  // The theme the user picked (shown by the header toggle).
  theme = this._theme.asReadonly();

  private _themedRoute = signal(false);

  // The theme actually applied to the page right now.
  appliedTheme = computed<Theme>(() =>
    this._themedRoute() ? this._theme() : 'dark'
  );

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) document: Document,
    router: Router
  ) {
    const isBrowser = isPlatformBrowser(platformId);

    if (isBrowser) {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        this._theme.set(stored);
      }

      // Set before the first navigation so public pages never flash light.
      this._themedRoute.set(this.isThemedUrl(document.location.pathname));
    }

    // ResolveEnd fires after guards/redirects but before the new page renders,
    // so the theme switches without a flash; NavigationEnd is a fallback.
    router.events.subscribe(event => {
      if (event instanceof ResolveEnd || event instanceof NavigationEnd) {
        this._themedRoute.set(this.isThemedUrl(event.urlAfterRedirects));
      }
    });

    // Keep <html data-theme="..."> in sync so global styles apply on every page.
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.appliedTheme());
    });

    // Remember the user's choice (not the forced dark of public pages).
    effect(() => {
      const theme = this._theme();
      if (isBrowser) {
        localStorage.setItem('theme', theme);
      }
    });
  }

  toggle() {
    this._theme.update(theme => (theme === 'dark' ? 'light' : 'dark'));
  }

  private isThemedUrl(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    return path === THEMED_PREFIX || path.startsWith(THEMED_PREFIX + '/');
  }

}
