import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import {ButtonModule } from "primeng/button";
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule,RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
