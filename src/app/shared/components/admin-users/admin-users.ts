import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth/auth';
import { AdminUserService } from '../../../features/services/adminuser/adminuser-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';
import { ConfirmService } from '../confirm-dialog/confirm';

@Component({
  selector: 'app-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FieldError, CommonModule, ReactiveFormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {

  private confirmDialog = inject(ConfirmService);

  admins: any[] = [];
  adminForm!: FormGroup;

  isEditMode = false;
  selectedAdminId = '';
  showModal = false;

  feedback = new Feedback();

  constructor(
    private api: AdminUserService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.buildForm();

    if (isPlatformBrowser(this.platformId) && this.auth.hasPermission('VIEW_ADMIN_USERS')) {
      this.loadAdmins();
    }
  }

  // Create needs a password; edit only changes it when one is typed.
  private buildForm(): void {
    this.adminForm = this.fb.group({
      fullName: ['', [AppValidators.required, AppValidators.personName, AppValidators.maxLength(200)]],
      email: ['', [AppValidators.required, AppValidators.email, AppValidators.maxLength(256)]],
      password: ['', [AppValidators.required, AppValidators.strongPassword, AppValidators.maxLength(128)]],
      isActive: [true]
    });
  }

  private setPasswordRules(required: boolean): void {
    const control = this.adminForm.get('password')!;
    control.setValidators(required
      ? [AppValidators.required, AppValidators.strongPassword, AppValidators.maxLength(128)]
      : [AppValidators.strongPassword, AppValidators.maxLength(128)]);
    control.updateValueAndValidity();
  }

  get canManage(): boolean {
    return this.auth.hasPermission('MANAGE_ADMIN_USERS');
  }

  loadAdmins(): void {
    this.api.getAdminUsers().subscribe({
      next: (res: any) => {
        this.admins = Array.isArray(res?.data) ? res.data : [];
        this.cd.markForCheck();
      },
      error: (err) => {
        this.admins = [];
        this.feedback.fail(err, 'Failed to load SuperAdmin accounts');
        this.cd.markForCheck();
      }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedAdminId = '';
    this.adminForm.reset({ fullName: '', email: '', password: '', isActive: true });
    this.setPasswordRules(true);
    this.showModal = true;
  }

  editAdmin(admin: any): void {
    this.isEditMode = true;
    this.selectedAdminId = admin.id;
    this.adminForm.reset({
      fullName: admin.fullName,
      email: admin.email,
      password: '',
      isActive: admin.isActive
    });
    this.setPasswordRules(false);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedAdminId = '';
  }

  save(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    const value = this.adminForm.value;

    if (!this.isEditMode) {
      this.api.createAdminUser({
        fullName: value.fullName,
        email: value.email,
        password: value.password
      }).subscribe({
        next: (res: any) => {
          this.closeModal();
          this.feedback.ok('SuperAdmin account created. They must change the password at first login.', res);
          this.loadAdmins();
          this.cd.markForCheck();
        },
        error: (err) => {
          this.feedback.fail(err, 'Failed to create the account');
          this.cd.markForCheck();
        }
      });
      return;
    }

    this.api.updateAdminUser(this.selectedAdminId, {
      fullName: value.fullName,
      email: value.email,
      isActive: value.isActive,
      newPassword: value.password || null
    }).subscribe({
      next: (res: any) => {
        this.closeModal();
        this.feedback.ok('SuperAdmin account updated', res);
        this.loadAdmins();
        this.cd.markForCheck();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to update the account');
        this.cd.markForCheck();
      }
    });
  }

  unlock(admin: any): void {
    this.api.unlockAdminUser(admin.id).subscribe({
      next: (res: any) => {
        this.feedback.ok('Account unlocked', res);
        this.loadAdmins();
        this.cd.markForCheck();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to unlock the account');
        this.cd.markForCheck();
      }
    });
  }

  async deleteAdmin(admin: any): Promise<void> {
    if (!(await this.confirmDialog.ask(`Delete the SuperAdmin account ${admin.email}? They lose access immediately.`))) {
      return;
    }

    this.api.deleteAdminUser(admin.id).subscribe({
      next: (res: any) => {
        this.feedback.ok('Account deleted', res);
        this.loadAdmins();
        this.cd.markForCheck();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to delete the account');
        this.cd.markForCheck();
      }
    });
  }
}
