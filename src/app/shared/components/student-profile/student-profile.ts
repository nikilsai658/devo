import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { UserStore } from '../../../core/store/user';

@Component({
  selector: 'app-student-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css'
})
export class StudentProfile {

  readonly user;

  constructor(private userStore: UserStore) {
    this.user = this.userStore.user;
  }

}
