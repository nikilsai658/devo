import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  // Route to open when clicked. The last item (current page) needs none.
  link?: string;
  // Router state to carry along (these pages pass ids via history.state).
  state?: Record<string, unknown>;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Breadcrumb {

  @Input() items: BreadcrumbItem[] = [];

  // Compact variant for dense headers (e.g. the coding screen).
  @Input() compact = false;

  constructor(private router: Router) {}

  go(item: BreadcrumbItem): void {
    if (!item.link) {
      return;
    }
    this.router.navigate([item.link], { state: item.state ?? {} });
  }
}
