import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { UserStore } from '../../../core/store/user';
import { Auth } from '../../../core/auth/auth';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css'
})
export class StudentProfile {
   user:any;
  private isBrowser: boolean;

  constructor(private userStore: UserStore, @Inject(PLATFORM_ID) platformId: Object, public auth:Auth) {
    this.user = this.userStore.user;
    this.isBrowser = isPlatformBrowser(platformId);

    this.selectedImage = this.isBrowser ? localStorage.getItem('profileImage') : null;
    this.resumeName = this.isBrowser ? localStorage.getItem('resumeName') : null;
    this.resumeUrl = this.isBrowser ? localStorage.getItem('resumeUrl') : null;
  }
  // ===========================
  // PROFILE IMAGE
  // ===========================

  selectedImage: string | null;

  // ===========================
  // RESUME
  // ===========================

  resumeName: string | null;

  resumeUrl: string | null;

}