import { DestroyRef, Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { clearSession, getAccessToken } from './token-storage';
import { UserStore } from '../store/user';
import { ToastService } from '../../shared/toast/toast';
import { readStorage, writeStorage } from '../storage';

// Signed-in sessions end after this long without keyboard, mouse, touch or scroll activity.
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const CHECK_EVERY_MS = 30 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
// Shared by all tabs, so working in one tab keeps the others signed in too.
const LAST_ACTIVITY_KEY = 'lastActivity';
// Writing the timestamp on every keystroke is wasteful; once per this interval is enough.
const RECORD_EVERY_MS = 5 * 1000;

@Injectable({ providedIn: 'root' })
export class IdleTimeout {

  private readonly router = inject(Router);
  private readonly userStore = inject(UserStore);
  private readonly toast = inject(ToastService);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private lastRecorded = 0;
  private started = false;

  // Starts watching (browser only, once). Call from the root component.
  start(destroyRef: DestroyRef): void {

    if (!this.isBrowser || this.started) {
      return;
    }

    this.started = true;

    // A session left idle past the limit (e.g. the browser was closed) ends on return.
    if (!this.check()) {
      this.recordActivity(true);
    }

    const onActivity = () => this.recordActivity();

    this.zone.runOutsideAngular(() => {
      for (const name of ACTIVITY_EVENTS) {
        window.addEventListener(name, onActivity, { passive: true, capture: true });
      }
    });

    const timer = setInterval(() => this.check(), CHECK_EVERY_MS);

    destroyRef.onDestroy(() => {
      clearInterval(timer);
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, onActivity, { capture: true });
      }
      this.started = false;
    });

  }

  // Exposed for tests: signs out when the shared last-activity time is too old.
  check(now = Date.now()): boolean {

    if (!getAccessToken()) {
      return false;
    }

    const last = Number(readStorage(LAST_ACTIVITY_KEY)) || now;

    if (now - last < IDLE_TIMEOUT_MS) {
      return false;
    }

    this.zone.run(() => {
      clearSession();
      this.userStore.clearUser();
      this.toast.error('You were signed out after 30 minutes of inactivity.');
      this.router.navigate(['/auth/login']);
    });

    return true;

  }

  private recordActivity(force = false): void {

    const now = Date.now();

    if (force || now - this.lastRecorded >= RECORD_EVERY_MS) {
      this.lastRecorded = now;
      writeStorage(LAST_ACTIVITY_KEY, String(now));
    }

  }

}
