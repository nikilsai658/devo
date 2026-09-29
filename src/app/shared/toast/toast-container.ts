import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from './toast';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'">

          <span class="toast-icon" aria-hidden="true">{{ toast.type === 'success' ? '✔' : '✖' }}</span>

          <span class="toast-message">{{ toast.message }}</span>

          <button
            type="button"
            class="toast-close"
            aria-label="Dismiss"
            (click)="toastService.dismiss(toast.id)">
            &times;
          </button>

        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: min(380px, calc(100vw - 40px));
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
      animation: toast-in 0.2s ease-out;
    }
    /* Light lavender needs dark text to stay readable. */
    .toast-success { background: #BFAFF9; color: #2F3E46; }
    .toast-error { background: #dc2626; }
    .toast-icon { flex-shrink: 0; }
    .toast-message { flex: 1; word-break: break-word; }
    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      color: inherit;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      opacity: 0.8;
    }
    .toast-close:hover { opacity: 1; }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
})
export class ToastContainer {
  readonly toastService = inject(ToastService);
}
