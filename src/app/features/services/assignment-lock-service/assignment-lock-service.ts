import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AssignmentViolation {
  type: 'tab-switch' | 'fullscreen-exit';
  message: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentLockService {

  private locked = false;

  tabSwitchCount = 0;
  fullscreenExitCount = 0;

  private violationsSubject = new Subject<AssignmentViolation>();
  readonly violations$ = this.violationsSubject.asObservable();

  private handleFullscreenChange = (): void => {
  if (!this.locked) {
    return; 
  }

  if (!document.fullscreenElement) {
    this.fullscreenExitCount++;

    this.violationsSubject.next({
      type: 'fullscreen-exit',
      message: 'You exited fullscreen mode.',
      count: this.fullscreenExitCount
    });

    // Escape (and other browser UI) exiting fullscreen can't be blocked
    // with preventDefault - it's a hard browser security restriction.
    // Re-requesting here is only a best-effort recovery: browsers may
    // refuse it because this handler isn't a fresh user gesture, so the
    // UI must also offer a manual "Resume Fullscreen" button as the
    // reliable fallback.
    this.requestFullscreen();
  }
};

  requestFullscreen(): void {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  startLock(): void {
  if (this.locked) {
    return;
  }

  this.locked = true;
  this.tabSwitchCount = 0;
  this.fullscreenExitCount = 0;

  // Policy: students may select, copy and cut their own code, but nothing may be pasted in.
  // Blocking the paste event itself (capture phase, before the editor sees it) covers every
  // route: Ctrl+V, Shift+Insert, Ctrl+Shift+V and the browser menu. Dropping dragged text is
  // the other way to bring code in.
  document.addEventListener('paste', this.preventAndStop, true);
  document.addEventListener('drop', this.preventAndStop, true);
  document.addEventListener('contextmenu', this.prevent);
  document.addEventListener('keydown', this.handleKeyboard);
  document.addEventListener('visibilitychange', this.handleVisibility);

  document.addEventListener(
    'fullscreenchange',
    this.handleFullscreenChange
  );
}

  stopLock(): void {
  this.locked = false;

  document.removeEventListener('paste', this.preventAndStop, true);
  document.removeEventListener('drop', this.preventAndStop, true);
  document.removeEventListener('contextmenu', this.prevent);
  document.removeEventListener('keydown', this.handleKeyboard);
  document.removeEventListener('visibilitychange', this.handleVisibility);

  document.removeEventListener(
    'fullscreenchange',
    this.handleFullscreenChange
  );
}
  private prevent = (event: Event): void => {
    event.preventDefault();
  };

  private preventAndStop = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  private handleKeyboard = (event: KeyboardEvent): void => {

    const key = (event.key ?? '').toLowerCase();

    // Print and save. (Paste is blocked at the paste event, see startLock; copy, cut and
    // select-all stay available for editing.)
    if (
      (event.ctrlKey || event.metaKey) &&
      ['p', 's'].includes(key)
    ) {
      event.preventDefault();
      return;
    }

    // F12
    if (event.key === 'F12') {
      event.preventDefault();
      return;
    }

    // Ctrl + Shift + I/J/C
    if (
      event.ctrlKey &&
      event.shiftKey &&
      ['i', 'j', 'c'].includes(key)
    ) {
      event.preventDefault();
      return;
    }

    // Ctrl + U
    if (
      (event.ctrlKey || event.metaKey) &&
      key === 'u'
    ) {
      event.preventDefault();
    }
  };

  private handleVisibility = (): void => {

    if (!this.locked) {
      return;
    }

    if (document.hidden) {

      this.tabSwitchCount++;

      this.violationsSubject.next({
        type: 'tab-switch',
        message: 'You switched tabs or minimized the window.',
        count: this.tabSwitchCount
      });

    }
  };
}
