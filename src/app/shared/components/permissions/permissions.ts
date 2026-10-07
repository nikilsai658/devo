import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef, ChangeDetectionStrategy
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

import { Auth } from '../../../core/auth/auth';
import { PermissionService } from '../../../features/services/permission/permission-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dialog/confirm';
@Component({
  selector: 'app-permission',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './permissions.html',
  styleUrls: ['./permissions.css']
})
export class Permission implements OnInit {

  private confirmDialog = inject(ConfirmService);


  permissions: any[] = [];

  permissionForm!: FormGroup;

  isEditMode = false;

  selectedPermissionId = 0;

  showModal = false;

  feedback = new Feedback();

  constructor(
    private api: PermissionService,
    private fb: FormBuilder,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.permissionForm = this.fb.group({

      name: ['', [AppValidators.required, AppValidators.title, AppValidators.minLength(3), AppValidators.maxLength(100)]],
      code: ['', [AppValidators.required, AppValidators.code, AppValidators.minLength(2), AppValidators.maxLength(50)]]

    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.auth.hasPermission('VIEW_PERMISSION')) {

      this.loadPermissions();

    }

  }

  //============================
  // Load
  //============================

  loadPermissions(): void {

    this.api.getPermissions().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        if (Array.isArray(res))
          this.permissions = res;

        else if (Array.isArray(res.data))
          this.permissions = res.data;

        else if (Array.isArray(res.result))
          this.permissions = res.result;

        else
          this.permissions = [];

      },

      error: err => { this.feedback.fail(err, 'Unable to load permissions.'); this.cd.markForCheck(); }

    });

  }

  //============================
  // Modal Controls
  //============================

  openAddModal(): void {

    if (!this.auth.hasPermission('CREATE_PERMISSION')) {
      this.feedback.fail('You do not have permission to add permissions.');
      return;
    }

    this.isEditMode = false;

    this.selectedPermissionId = 0;

    this.permissionForm.reset();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.resetForm();

  }

  //============================
  // Create
  //============================

  createPermission(): void {

    if (!this.auth.hasPermission('CREATE_PERMISSION')) {
      this.feedback.fail('You do not have permission to add permissions.');
      return;
    }

    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    this.api.createPermission(this.permissionForm.value).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.resetForm();

        this.feedback.ok('Permission added successfully');

        this.loadPermissions();

      },

      error: err => { this.cd.markForCheck(); return this.feedback.fail(err, 'Failed to add permission'); }

    });

  }

  //============================
  // Edit
  //============================

  editPermission(permission: any): void {

    if (!this.auth.hasPermission('UPDATE_PERMISSION')) {
      this.feedback.fail('You do not have permission to edit permissions.');
      return;
    }

    this.isEditMode = true;

    this.selectedPermissionId = permission.id;

    this.permissionForm.patchValue({

      name: permission.name,

      code: permission.code

    });

    this.showModal = true;

  }

  //============================
  // Update
  //============================

  updatePermission(): void {

    if (!this.auth.hasPermission('UPDATE_PERMISSION')) {
      this.feedback.fail('You do not have permission to edit permissions.');
      return;
    }

    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    this.api.updatePermission(

      this.selectedPermissionId,

      this.permissionForm.value

    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.resetForm();

        this.feedback.ok('Permission updated successfully');

        this.loadPermissions();

      },

      error: err => { this.cd.markForCheck(); return this.feedback.fail(err, 'Failed to update permission'); }

    });

  }

  //============================
  // Delete
  //============================

  async deletePermission(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_PERMISSION')) {
      this.feedback.fail('You do not have permission to delete permissions.');
      return;
    }

    if (!(await this.confirmDialog.ask('Delete Permission?')))
      return;

    this.api.deletePermission(id).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.feedback.ok('Permission deleted successfully', res);

        this.loadPermissions();

      },

      error: err => { this.cd.markForCheck(); return this.feedback.fail(err, 'Failed to delete permission'); }

    });

  }

  //============================
  // Reset
  //============================

  resetForm(): void {

    this.permissionForm.reset({

      name: '',

      code: ''

    });

    this.isEditMode = false;

    this.selectedPermissionId = 0;

    this.showModal = false;

  }

}