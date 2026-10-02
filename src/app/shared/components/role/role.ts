import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID, ChangeDetectionStrategy
, inject } from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { Auth } from '../../../core/auth/auth';
import { RoleService } from '../../../features/services/role/role-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dailog/confirm';
@Component({
  selector: 'app-role',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './role.html',
  styleUrls: ['./role.css']
})
export class Role implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  roles: any[] = [];

  roleForm: FormGroup;

  isEditMode = false;

  selectedRoleId = 0;

  showModal = false;

  constructor(
    private api: RoleService,
    private fb: FormBuilder,
    private cookie: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {

    // Initialize form here
   this.roleForm = this.fb.group({
  name: ['', [AppValidators.required, AppValidators.title, AppValidators.minLength(2), AppValidators.maxLength(50)]],
  requiresCollege: [true],
  requiresDepartment: [true],
  requiresBranch: [true],
  requiresYear: [true]
});

  }

  ngOnInit(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.cookie.get('token');

    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.auth.hasPermission('VIEW_ROLE')) {
      this.feedback.fail('You do not have permission to view Roles.');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadRoles();
  }

  //==============================
  // Load Roles
  //==============================

  loadRoles(): void {

    this.api.getRoles().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        if (Array.isArray(res)) {
          this.roles = res;
        } else if (Array.isArray(res.data)) {
          this.roles = res.data;
        } else if (Array.isArray(res.result)) {
          this.roles = res.result;
        } else {
          this.roles = [];
        }
        
        this.cd.detectChanges();

      },

      error: (err) => {
        this.cd.markForCheck();

        console.error(err);
        this.roles = [];
      }

    });

  }

  //==============================
  // Modal Controls
  //==============================

  openAddModal(): void {

    if (!this.auth.hasPermission('CREATE_ROLE')) {
      this.feedback.fail('You do not have permission to create Role.');
      return;
    }

    this.resetForm();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.resetForm();

  }

  //==============================
  // Create Role
  //==============================

  createRole(): void {

    if (!this.auth.hasPermission('CREATE_ROLE')) {
      this.feedback.fail('You do not have permission to create Role.');
      return;
    }

    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.api.createRole(this.roleForm.value).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Role added successfully');

        this.resetForm();

        this.loadRoles();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //==============================
  // Edit Role
  //==============================

  editRole(role: any): void {

    if (!this.auth.hasPermission('UPDATE_ROLE')) {
      this.feedback.fail('You do not have permission to edit Role.');
      return;
    }

    this.isEditMode = true;

    this.selectedRoleId = role.id;

    this.roleForm.patchValue({

      name: role.name,
      requiresCollege: role.requiresCollege,
      requiresDepartment: role.requiresDepartment,
      requiresBranch: role.requiresBranch,
      requiresYear: role.requiresYear

    });

    this.showModal = true;

  }

  //==============================
  // Update Role
  //==============================

  updateRole(): void {

    if (!this.auth.hasPermission('UPDATE_ROLE')) {
      this.feedback.fail('You do not have permission to update Role.');
      return;
    }

    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.api.updateRole(
      this.selectedRoleId,
      this.roleForm.value
    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Role updated successfully');

        this.resetForm();

        this.loadRoles();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //==============================
  // Delete Role
  //==============================

  async deleteRole(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_ROLE')) {
      this.feedback.fail('You do not have permission to delete Role.');
      return;
    }

    if (!(await this.confirmDialog.ask('Are you sure you want to delete this Role?'))) {
      return;
    }

    this.api.deleteRole(id).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.feedback.ok('Role deleted successfully', res);

        this.loadRoles();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //==============================
  // Reset Form
  //==============================

  resetForm(): void {

    this.roleForm.reset({

      roleName: '',
      requiresCollege: true,
      requiresDepartment: true,
      requiresBranch: true,
      requiresYear: true

    });

    this.isEditMode = false;
    this.selectedRoleId = 0;
    this.showModal = false;

  }

}