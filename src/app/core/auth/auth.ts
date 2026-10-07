import { Injectable } from '@angular/core';
import { Permission, User, UserStore } from '../store/user';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  constructor(private userStore: UserStore) {}

  getUser(): User | null {

    return this.userStore.user();

  }

  getPermissions(): Permission[] {

    return this.userStore.user()?.permissions ?? [];

  }

  hasPermission(permission: string): boolean {

    return this.getPermissions().some(
      p => p.code === permission
    );

  }

}
