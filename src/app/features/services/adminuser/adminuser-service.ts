import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  constructor(private api: Api) {}

  getAdminUsers() {
    return this.api.GET('AdminUser');
  }
  getAdminUserById(id: string) {
    return this.api.GET(`AdminUser/${id}`);
  }
  createAdminUser(data: any) {
    return this.api.POST('AdminUser', data);
  }
  updateAdminUser(id: string, data: any) {
    return this.api.PUT(`AdminUser/${id}`, data);
  }
  unlockAdminUser(id: string) {
    return this.api.PUT(`AdminUser/${id}/unlock`, {});
  }
  deleteAdminUser(id: string) {
    return this.api.DELETE(`AdminUser/${id}`);
  }
}
