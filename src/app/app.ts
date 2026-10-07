import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/toast/toast-container';
import { ConfirmDialog } from './shared/components/confirm-dialog/confirm-dialog';
import { ThemeStore } from './core/store/theme';
import { Loading } from './core/loading/loading';
import { IdleTimeout } from './core/auth/idle-timeout';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastContainer, ConfirmDialog],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  // Requests in flight, shown as the thin bar at the top of every page.
  readonly loading = inject(Loading);

  constructor() {
    // Instantiated here so the saved theme applies on every route, including pages without the header.
    inject(ThemeStore);
    inject(IdleTimeout).start(inject(DestroyRef));
  }

}
