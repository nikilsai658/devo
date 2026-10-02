import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  // Red confirm button for destructive actions (the default).
  danger?: boolean;
}

export interface ConfirmRequest extends Required<ConfirmOptions> {
  message: string;
}

// App-wide in-page replacement for window.confirm(), rendered by
// <app-confirm-dailog> in the root. `ask` resolves true on OK, false on Cancel.
@Injectable({ providedIn: 'root' })
export class ConfirmService {

  readonly request = signal<ConfirmRequest | null>(null);

  private resolver: ((ok: boolean) => void) | null = null;

  ask(message: string, options: ConfirmOptions = {}): Promise<boolean> {

    // A new question cancels one that is still open.
    this.close(false);

    this.request.set({
      message,
      title: options.title ?? 'Are you sure?',
      confirmText: options.confirmText ?? 'Delete',
      cancelText: options.cancelText ?? 'Cancel',
      danger: options.danger ?? true
    });

    return new Promise<boolean>(resolve => (this.resolver = resolve));

  }

  close(ok: boolean): void {

    const resolve = this.resolver;

    this.resolver = null;

    this.request.set(null);

    resolve?.(ok);

  }

}
