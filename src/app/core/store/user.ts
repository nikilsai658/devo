import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { readStoredUser } from '../auth/token-storage';

export interface Permission {
  code: string;
  [key: string]: unknown;
}

// The signed-in user's profile. Tokens are deliberately not part of it
// (see token-storage.ts).
export interface User {

  userId: string;
  name: string;
  email: string;
  role: string;

  isFirstLogin: boolean;
  profileCompleted: boolean;

  permissions: Permission[];

  collegeId: number;
  collegeName: string;

  departmentId: number;
  departmentName: string;

  branchId: number;
  branchName: string;

  yearId: number;
  yearNumber: number;

  semester: number;

}

@Injectable({
  providedIn: 'root'
})
export class UserStore {

  private _user = signal<User | null>(null);

  user = this._user.asReadonly();

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    if (isPlatformBrowser(platformId)) {
      this._user.set(readStoredUser() as User | null);
    }
  }

  setUser(user: User) {
    this._user.set(user);
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch {}
  }

  // Updates part of the stored profile (e.g. after the first-login password change).
  patchUser(changes: Partial<User>) {
    const current = this._user();
    if (current) {
      this.setUser({ ...current, ...changes });
    }
  }

  clearUser() {
    this._user.set(null);
    try {
      localStorage.removeItem('user');
    } catch {}
  }

}
