import { Component, ElementRef, ViewChild, DestroyRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { Header } from '../../shared/components/header/header';

// The signed-in app shell (/main): header plus the routed page.
@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [Header, RouterOutlet],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin {

  @ViewChild('content') contentRef?: ElementRef<HTMLElement>;

  constructor() {
    // Pages scroll inside the fixed .content frame, not the window, so the
    // router's scrollPositionRestoration can't reset it. Do it on every navigation.
    inject(Router).events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe(() => {
        this.contentRef?.nativeElement.scrollTo({ top: 0, left: 0 });
      });
  }

}
