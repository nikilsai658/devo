import { CommonModule , isPlatformBrowser} from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Logo } from '../../../shared/logo/logo';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ActivatedRoute, Router } from '@angular/router';
import {AuthServices} from '../../services/auth/auth-services';
import { AppValidators, FieldError } from '../../../shared/validation';
import { readStorage } from '../../../core/storage';
import { extractErrorMessage } from '../../../shared/feedback/feedback';
import { ToastService } from '../../../shared/toast/toast';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule,CommonModule,Logo,InputTextModule,ButtonModule,PasswordModule,FloatLabelModule,FieldError],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css', '../auth-responsive.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPassword implements OnInit {
  Form !: FormGroup;
  collegecode: string | null = null;
  message = '';
  loading = false;
  messageType: 'success' | 'error' = 'error';

  // From the emailed reset link (?userId=...&token=...).
  userId = '';
  token = '';

  constructor(private router:Router,private auth:AuthServices , private fb:FormBuilder, private route:ActivatedRoute,private cd: ChangeDetectorRef,private toast: ToastService,@Inject(PLATFORM_ID) private platformId: Object){
    this.Form=this.fb.group({
      newPassword:['',[AppValidators.required, AppValidators.strongPassword]],
      confirmPassword:['',AppValidators.required],
      CollegeCode:['',Validators.required]
    }, { validators: AppValidators.matchFields('newPassword', 'confirmPassword') })
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.collegecode = readStorage('collegecode');

      if (this.collegecode) {
        this.Form.patchValue({ CollegeCode: this.collegecode });
      }
    }

    const params = this.route.snapshot.queryParamMap;
    this.userId = params.get('userId') ?? '';
    this.token = params.get('token') ?? '';

    if (!this.userId || !this.token) {
      this.messageType = 'error';
      this.message = 'This reset link is incomplete. Open the link from the email again, or request a new one.';
    }
  }

  onSubmit(){
   this.message = '';

   if (!this.userId || !this.token) {
    this.messageType = 'error';
    this.message = 'This reset link is incomplete. Open the link from the email again, or request a new one.';
    this.cd.markForCheck();
    return;
   }

   if(this.Form.valid){
    const body = {
      ...this.Form.value,
      userId: this.userId,
      token: this.token
    };
    this.loading = true;
    this.cd.markForCheck();

    this.auth.resetpassword(body).subscribe({
      next:()=>{
        this.loading = false;
        // A toast, because the page is left right away and an inline message would never be seen.
        this.toast.success('Password changed successfully. Please log in with your new password.');
        this.router.navigate(['/auth/login']);
      },error:(err :any)=>{
        this.loading = false;
        this.messageType = 'error';
        this.message = extractErrorMessage(err, 'Failed to reset password. Please try again.');
        this.cd.markForCheck();
      }
    })
   }else{
    this.Form.markAllAsTouched();

    this.messageType = 'error';
    this.message = 'Please correct the highlighted fields and try again.';
    this.cd.markForCheck();
   }
  }
}
