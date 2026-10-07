import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from '../../shared/toast/toast';

// Errors nothing else caught (a bug, not a failed request — those are reported by
// each page). They are still logged for debugging, and the user gets one notice
// instead of a page that silently stops working.
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  private readonly toast = inject(ToastService);

  private lastShown = 0;

  handleError(error: unknown): void {

    console.error(error);

    // HTTP failures are handled where the request was made.
    if ((error as { name?: string })?.name === 'HttpErrorResponse') {
      return;
    }

    const now = Date.now();

    // One notice per burst: a broken template can throw on every change detection.
    if (now - this.lastShown > 10_000) {
      this.lastShown = now;
      this.toast.error('Something went wrong on this page. If it keeps happening, reload the page.');
    }

  }

}
