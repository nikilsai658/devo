import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-nav-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './nav-item.html',
  styleUrl: './nav-item.css',
})
export class NavItem {}
