import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-students',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './students.html',
  styleUrl: './students.css',
})
export class Students {}
