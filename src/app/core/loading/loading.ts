import { Injectable, computed, signal } from '@angular/core';

// Counts HTTP requests in flight (see loadingInterceptor) so the app can show
// one global progress bar instead of every page inventing its own.
@Injectable({
  providedIn: 'root',
})
export class Loading {

  private readonly pending = signal(0);

  readonly active = computed(() => this.pending() > 0);

  start(): void {
    this.pending.update(n => n + 1);
  }

  stop(): void {
    this.pending.update(n => Math.max(0, n - 1));
  }

}
