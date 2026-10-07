import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { Router } from '@angular/router';
import { AuthServices } from '../services/auth/auth-services';
import { Logo } from '../../shared/logo/logo';
import { AppValidators, FieldError } from '../../shared/validation';
import { ToastService } from '../../shared/toast/toast';
import { extractErrorMessage } from '../../shared/feedback/feedback';
import { UserStore } from '../../core/store/user';
import { pendingOnboardingStep } from '../../core/guards/onboarding-guard';

// First-login password change (the in-app one is shared/components/change-password).
@Component({
  selector: 'app-changepassword',
  standalone:true,
  imports: [CommonModule,ReactiveFormsModule,FloatLabelModule,ButtonModule,PasswordModule,Logo,FieldError],
  templateUrl: './changepassword.html',
  styleUrl: './changepassword.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Changepassword {
  Form !:FormGroup;
  errorMessage = '';
  loading = false;
  constructor(private router:Router,private api:AuthServices, private fb:FormBuilder,private cd:ChangeDetectorRef,private toast:ToastService,private userStore:UserStore){
    this.Form=this.fb.group({
      oldPassword:['',AppValidators.required],
      newPassword:['',[AppValidators.required, AppValidators.strongPassword]],
      confirmPassword:['',AppValidators.required]
    }, {
      validators: [
        AppValidators.differentFrom('oldPassword', 'newPassword'),
        AppValidators.matchFields('newPassword', 'confirmPassword')
      ]
    })
  }

  onSubmit(){
      this.errorMessage = '';

      if(this.Form.valid){
        this.loading = true;
        this.cd.markForCheck();

        this.api.changepassword(this.Form.value).subscribe({
          next:()=>{
            this.loading = false;
            this.toast.success('Password changed successfully');
            this.userStore.patchUser({ isFirstLogin: false });
            // Next first-login step (profile), or straight into the app when the profile is done.
            this.router.navigateByUrl(pendingOnboardingStep() ?? '/main');
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = extractErrorMessage(err, 'Unable to change password. Please try again.');
            this.cd.markForCheck();
          }
        }
        )
      }else{
        this.Form.markAllAsTouched();
        this.errorMessage = 'Please correct the highlighted fields and try again.';
        this.cd.markForCheck();
      }
  }
}
