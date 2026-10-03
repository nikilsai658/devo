import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

interface QuickLink {
  label: string;
  hint: string;
  link: string;
  icon: string;
}

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-not-found.html',
  styleUrl: './page-not-found.css'
})
export class NotFoundComponent {

  // The URL the user actually asked for. The '**' route redirects here, so
  // the address bar only shows /page-not-found; the navigation that brought
  // us here still remembers the original target.
  readonly requestedUrl: string | null;

  readonly quickLinks: QuickLink[] = [
    { label: 'My Domains', hint: 'Continue learning', link: '/main/student-domain',
      icon: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11ZM8 8h8M8 12h8M8 16h4' },
    { label: 'My Tickets', hint: 'Track support requests', link: '/main/mytickets',
      icon: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h3' },
    { label: 'My Profile', hint: 'Account details', link: '/main/profile',
      icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0' },
  ];

  constructor(private location: Location, router: Router) {
    const url = router.currentNavigation()?.initialUrl?.toString() ?? null;
    this.requestedUrl = url && url !== '/page-not-found' ? url : null;
  }

  goBack(): void {
    this.location.back();
  }
}
