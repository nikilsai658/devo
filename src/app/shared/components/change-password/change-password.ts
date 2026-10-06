import { ChangeDetectorRef, Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthServices } from '../../../features/services/auth/auth-services';
import { AppValidators, FieldError } from '../../validation';
import { ToastService } from '../../toast/toast';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FieldError],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePassword {

  loading = false;

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  Form: any;

  constructor(
    private fb: FormBuilder,
    private auth: AuthServices,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.Form = this.fb.group(
      {
        oldPassword: ['', AppValidators.required],
        newPassword: ['', [AppValidators.required, AppValidators.strongPassword]],
        confirmPassword: ['', AppValidators.required],
      },
      {
        validators: [
          AppValidators.differentFrom('oldPassword', 'newPassword'),
          AppValidators.matchFields('newPassword', 'confirmPassword'),
        ],
      }
    );
  }

  onSubmit(): void {
    if (this.Form.invalid) {
      this.Form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const { oldPassword, newPassword, confirmPassword } = this.Form.value;

    this.auth.changepassword({ oldPassword, newPassword, confirmPassword }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.toast.success('Password changed successfully');
        this.Form.reset();
        this.router.navigate(['/main/profile']);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        console.log('Error:', err);
        this.toast.error(err?.error?.message ?? 'Failed to change password');
        this.cdr.markForCheck();
      },
    });
  }
}
