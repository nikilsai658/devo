import { Inject, Injectable, PLATFORM_ID, effect, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeStore {

  private _theme = signal<Theme>('dark');

  theme = this._theme.asReadonly();

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) document: Document
  ) {
    const isBrowser = isPlatformBrowser(platformId);

    if (isBrowser) {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        this._theme.set(stored);
      }
    }

    // Keep <html data-theme="..."> in sync so global styles apply on every page.
    effect(() => {
      const theme = this._theme();
      document.documentElement.setAttribute('data-theme', theme);
      if (isBrowser) {
        localStorage.setItem('theme', theme);
      }
    });
  }

  toggle() {
    this._theme.update(theme => (theme === 'dark' ? 'light' : 'dark'));
  }

}
