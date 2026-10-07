import { Injectable } from '@angular/core';
import {Api} from '../../../core/api/api';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private api:Api){}
  getUsers(
  roleName?: string,
  collegeName?: string,
  departmentName?: string,
  branchName?: string,
  yearNumber?: number,
  isActive?: boolean
  ) {

  let params: any = {};

  if (roleName) {
    params.RoleName = roleName;
  }

  if (collegeName) {
    params.CollegeName = collegeName;
  }

  if (departmentName) {
    params.DepartmentName = departmentName;
  }

  if (branchName) {
    params.BranchName = branchName;
  }

  if (yearNumber) {
    params.YearNumber = yearNumber;
  }

  if (isActive !== undefined) {
    params.IsActive = isActive;
  }

  return this.api.GET('User',params);
  }
  getUserById(id:number){
    return this.api.GET(`User/${id}`);
  }
  createUser(data:any){
    return this.api.POST('User',data);
  }
  // Creates the user with a random password that the API emails to them. The endpoint reads a
  // form and has no field for the password, phone number or semester.
  createUserAutoPassword(data: Record<string, any>){
    const form = new FormData();
    const names: Record<string, string> = {
      fullName: 'FullName', email: 'Email', registerNumber: 'RegisterNumber', roleName: 'RoleName',
      collegeName: 'CollegeName', departmentName: 'DepartmentName', branchName: 'BranchName', yearNumber: 'YearNumber'
    };
    for (const [key, field] of Object.entries(names)) {
      const value = data[key];
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        form.append(field, String(value));
      }
    }
    return this.api.POST('User/create-auto-password', form);
  }
  updateUser(id:number,data:any){
    return this.api.PUT(`User/${id}`,data);
  }
  deleteUser(id:number){
    return this.api.DELETE(`User/${id}`);
  }
uploadUsers(file: File) {

  const formData = new FormData();

  // Fixed key expected by backend
  formData.append('file', file);

  return this.api.POSTWithProgress('User/BulkUpload', formData);

}
progress(jobId: string) {
  return this.api.GET(`User/BulkUpload/${jobId}/status`, undefined, { background: true });
}
successusers(uploadId: string) {
  return this.api.GET(`User/BulkUpload/${uploadId}/success`);
}
failedusers(uploadId: string) {
  return this.api.GET(`User/BulkUpload/${uploadId}/failed`);
}
}
