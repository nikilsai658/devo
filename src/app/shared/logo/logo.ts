import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:true,
  imports: [],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class Logo {}
