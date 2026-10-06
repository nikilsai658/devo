import { Injectable } from '@angular/core';
import {Api} from '../../../core/api/api';
@Injectable({
  providedIn: 'root',
})
export class RoleService {
  constructor(private api:Api){}
  getRoles(){
    return this.api.GET('Role');
  }
  // The roles the signed-in user is allowed to give to someone (their own role's descendants;
  // every role for a SuperAdmin).
  getAssignableRoles(){
    return this.api.GET('Role/assignable');
  }
  getRoleById(id:number){
    return this.api.GET(`Role/${id}`);
  }
  createRole(data:any){
    return this.api.POST('Role',data);
  }
  updateRole(id:number,data:any){
    return this.api.PUT(`Role/${id}`,data);
  }
  deleteRole(id:number){
    return this.api.DELETE(`Role/${id}`);
  }
}
