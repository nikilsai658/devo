import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/toast/toast-container';
import { ConfirmDailog } from './shared/components/confirm-dailog/confirm-dailog';
import { ThemeStore } from './core/store/theme';


@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastContainer, ConfirmDailog],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Instantiated here so the saved theme applies on every route, including pages without the header.
  constructor(private themeStore: ThemeStore) {}
}
