import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { AuthServices } from '../services/auth/auth-services';
import { Logo } from '../../shared/logo/logo';
import { AppValidators, DigitsOnly, FieldError } from '../../shared/validation';
import { ToastService } from '../../shared/toast/toast';
@Component({
  selector: 'app-profile-page',
  imports: [CommonModule,ReactiveFormsModule,InputTextModule,FloatLabelModule,ButtonModule,Logo,FieldError,DigitsOnly],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePage {
  Form !:FormGroup;
  errorMessage = '';
  loading = false;
  constructor(private fb:FormBuilder,private router:Router, private cookie:CookieService,private auth:AuthServices,private cd:ChangeDetectorRef,private toast:ToastService){
    this.Form=this.fb.group({
      fullName: ['',[AppValidators.required, AppValidators.personName, AppValidators.minLength(3), AppValidators.maxLength(100)]],
      firstName: ['',[AppValidators.required, AppValidators.personName, AppValidators.maxLength(50)]],
      middleName: ['',[AppValidators.personName, AppValidators.maxLength(50)]],
      lastName: ['',[AppValidators.required, AppValidators.personName, AppValidators.maxLength(50)]],
      phoneNumber:['',[AppValidators.required, AppValidators.phone]],
      alternatePhoneNumber: ['',AppValidators.phone],
      alternateEmail:['',[AppValidators.email, AppValidators.maxLength(100)]]
    }, { validators: AppValidators.differentFrom('phoneNumber', 'alternatePhoneNumber') })
  }

  onSubmit(){
    this.errorMessage = '';

    if(this.Form.valid){
      this.loading = true;
      this.cd.markForCheck();

      this.auth.profileupdate(this.Form.value).subscribe({
        next:(res)=>{
          this.loading = false;
          this.toast.success('Profile updated successfully');
          this.router.navigate(['/main']);
        },error:(err)=>{
          console.log(err);
          this.loading = false;
          this.errorMessage = this.extractErrorMessage(err);
          this.cd.markForCheck();
        }
      })
    }else{
      this.Form.markAllAsTouched();
      this.errorMessage = 'Please correct the highlighted fields and try again.';
      this.cd.markForCheck();
    }
  }

  private extractErrorMessage(err: any): string {
    const body = err?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    return (
      body?.message ||
      body?.title ||
      body?.error ||
      body?.errorMessage ||
      'Unable to update profile. Please try again.'
    );
  }
}
